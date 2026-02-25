'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { useWebSocket } from '@/hooks/useWebSocket';

const CATEGORIES = ['all','plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

export default function NearbyJobsPage() {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [coords, setCoords]       = useState(null);
  const [category, setCategory]   = useState('all');
  const router = useRouter();

  useWebSocket({
    // Normalize the broadcast payload so JobCard always gets a valid job object
    'job.created': (payload) => {
      setJobs(prev => [{ ...payload, id: payload.id ?? payload.job_id }, ...prev]);
    },
  });

  const fetchNearby = (lat, lng, cat = category) => {
    setLoading(true);
    const params = { lat, lng, ...(cat !== 'all' && { category: cat }) };
    jobsApi.nearby(params)
      .then(({ data }) => setJobs(data.data ?? []))
      .catch(() => { /* leave list empty */ })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchNearby(14.5995, 120.9842);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        fetchNearby(c.latitude, c.longitude);
      },
      () => {
        fetchNearby(14.5995, 120.9842);
      }
    );
  }, []);

  const refresh = (cat = category) => {
    const lat = coords?.lat ?? 14.5995;
    const lng = coords?.lng ?? 120.9842;
    fetchNearby(lat, lng, cat);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    refresh(cat);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Nearby Jobs</h1>
        <Button size="sm" variant="secondary" onClick={() => refresh()}>Refresh</Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              category === cat
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
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
