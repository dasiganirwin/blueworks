'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JobChat } from '@/components/jobs/JobChat';
import { JobMap } from '@/components/ui/JobMap';

const NEXT_STATUS = { pending: 'accepted', accepted: 'en_route', en_route: 'in_progress', in_progress: 'completed' };

const ACTION_CONFIG = {
  pending: {
    label: 'Accept Job',
    subtitle: "Confirm you're taking this job",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  accepted: {
    label: 'Start Navigation',
    subtitle: 'Tap when you leave for the job',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" />
        <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  en_route: {
    label: 'Start Work',
    subtitle: 'Tap when you arrive and begin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a1 1 0 0 1 2 0v1h2a1 1 0 0 1 .707 1.707l-1.5 1.5A5.978 5.978 0 0 1 15 11v6a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-6a5.978 5.978 0 0 1 .793-2.793l-1.5-1.5A1 1 0 0 1 9 5h2V4z" />
      </svg>
    ),
  },
  in_progress: {
    label: 'Mark Complete',
    subtitle: 'Tap when the job is finished',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.9-5.7A8.38 8.38 0 0 1 3 12a9 9 0 1 1 9 9 8.38 8.38 0 0 1-3.3-.676L3 21z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
};

export default function WorkerJobDetailPage() {
  const { id }   = useParams();
  const { user } = useAuthContext();
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { sendLocationPing, subscribeToJob } = useWebSocket({
    'job.status_changed': ({ job_id, status }) => {
      if (job_id === id) setJob(j => j ? { ...j, status } : j);
    },
  });

  useEffect(() => {
    jobsApi.getById(id)
      .then(({ data }) => setJob(data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
    subscribeToJob(id);
  }, [id]);

  // ── Broadcast worker location every 10s while en_route or in_progress ──────
  useEffect(() => {
    if (!job || !['en_route', 'in_progress'].includes(job.status)) return;
    if (!navigator?.geolocation) return;

    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => sendLocationPing(coords.latitude, coords.longitude, id),
        () => { /* ignore — no GPS or permission denied */ }
      );
    };

    ping(); // fire immediately on status entry
    const timer = setInterval(ping, 10_000);
    return () => clearInterval(timer);
  }, [job?.status, id, sendLocationPing]);

  const handleStatusUpdate = async () => {
    const next = NEXT_STATUS[job.status];
    if (!next) return;
    setUpdating(true);
    try {
      await jobsApi.updateStatus(id, next);
      const { data } = await jobsApi.getById(id);
      setJob(data);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="page-container"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!job)    return <div className="page-container"><p className="text-gray-500">Job not found.</p></div>;

  const nextAction = NEXT_STATUS[job.status];

  return (
    <div className="page-container space-y-4">
      <Link href="/worker/jobs/nearby" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to Find Jobs
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/worker/dashboard" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Job Detail</span>
      </nav>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-brand-600 uppercase">{job.category}</p>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5">{job.description.slice(0, 80)}</h1>
        </div>
        <Badge status={job.status} />
      </div>

      <Card>
        <p className="text-xs text-gray-500 mb-1">Customer</p>
        <p className="font-semibold">{job.customer?.name}</p>
      </Card>

      <Card>
        <p className="text-xs text-gray-500 mb-1">Location</p>
        <p className="text-sm">{job.location_address}</p>
        {['en_route', 'in_progress'].includes(job.status) && job.location_lat && job.location_lng && (
          <a
            href={`https://maps.google.com/?q=${job.location_lat},${job.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-brand-600 font-medium hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </Card>

      {/* Customer location map — visible once job is accepted */}
      {['accepted', 'en_route', 'in_progress'].includes(job.status) && job.location_lat && job.location_lng && (
        <JobMap
          lat={job.location_lat}
          lng={job.location_lng}
          label="Customer location"
          markerColor="2563eb"
        />
      )}

      {job.job_photos?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Job Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {job.job_photos.map((p, i) => (
              <img key={i} src={p.url} alt={`Job photo ${i + 1}`} className="h-24 w-24 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {nextAction && (() => {
        const cfg = ACTION_CONFIG[job.status];
        return (
          <Button className="w-full" size="lg" loading={updating} onClick={handleStatusUpdate}>
            <span className="flex flex-col items-center gap-1 py-1">
              <span className="flex items-center gap-2">
                {cfg.icon}
                <span className="font-semibold">{cfg.label}</span>
              </span>
              <span className="text-xs font-normal opacity-80">{cfg.subtitle}</span>
            </span>
          </Button>
        );
      })()}

      {['accepted','en_route','in_progress','completed'].includes(job.status) && (
        <JobChat jobId={id} currentUserId={user?.id} readOnly={['completed','cancelled'].includes(job.status)} />
      )}
    </div>
  );
}
