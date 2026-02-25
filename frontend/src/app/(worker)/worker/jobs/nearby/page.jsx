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
    // Normalize the broadcast payload so JobCard always gets a valid job object
    'job.created': (payload) => {
      setJobs(prev => [{ ...payload, id: payload.id ?? payload.job_id }, ...prev]);
    },
  });

  useEffect(() => {
    const fetchNearby = (lat, lng) => {
      jobsApi.nearby({ lat, lng })
        .then(({ data }) => setJobs(data.data ?? []))
        .catch(() => { /* leave list empty */ })
        .finally(() => setLoading(false));
    };

    if (!navigator.geolocation) {
      // No geolocation API — fall back to Manila coords immediately
      fetchNearby(14.5995, 120.9842);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        fetchNearby(c.latitude, c.longitude);
      },
      () => {
        // Permission denied or unavailable — fall back
        fetchNearby(14.5995, 120.9842);
      }
    );
  }, []);

  const refresh = () => {
    setLoading(true);
    const lat = coords?.lat ?? 14.5995;
    const lng = coords?.lng ?? 120.9842;
    jobsApi.nearby({ lat, lng })
      .then(({ data }) => setJobs(data.data ?? []))
      .catch(() => { /* leave list empty */ })
      .finally(() => setLoading(false));
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
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-sm text-gray-500">No jobs available near you right now.</p>
          <Button size="sm" variant="secondary" onClick={refresh}>Refresh</Button>
        </div>
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
