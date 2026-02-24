'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function NearbyJobsPage() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords]   = useState(null);
  const router = useRouter();

  useWebSocket({
    'job.created': (payload) => {
      setJobs(prev => [{ ...payload, status: 'pending', created_at: new Date().toISOString() }, ...prev]);
    },
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        jobsApi.nearby({ lat: c.latitude, lng: c.longitude })
          .then(({ data }) => setJobs(data.data ?? []))
          .finally(() => setLoading(false));
      },
      () => {
        // Fallback: default Manila coords
        jobsApi.nearby({ lat: 14.5995, lng: 120.9842 })
          .then(({ data }) => setJobs(data.data ?? []))
          .finally(() => setLoading(false));
      }
    );
  }, []);

  const refresh = () => {
    setLoading(true);
    const lat = coords?.lat ?? 14.5995;
    const lng = coords?.lng ?? 120.9842;
    jobsApi.nearby({ lat, lng }).then(({ data }) => setJobs(data.data ?? [])).finally(() => setLoading(false));
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Nearby Jobs</h1>
        <Button size="sm" variant="secondary" onClick={refresh}>Refresh</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No jobs available near you.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => router.push(`/worker/jobs/${job.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
