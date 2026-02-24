'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JobChat } from '@/components/jobs/JobChat';

const NEXT_STATUS = { pending: 'accepted', accepted: 'en_route', en_route: 'in_progress', in_progress: 'completed' };
const NEXT_LABEL  = { pending: 'Accept Job', accepted: 'Start Navigation', en_route: 'Start Work', in_progress: 'Mark Complete' };

export default function WorkerJobDetailPage() {
  const { id }   = useParams();
  const { user } = useAuthContext();
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    jobsApi.getById(id).then(({ data }) => setJob(data)).finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    const next = NEXT_STATUS[job.status];
    if (!next) return;
    setUpdating(true);
    try {
      const { data } = await jobsApi.updateStatus(id, next);
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
        {job.status === 'en_route' && (
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

      {job.job_photos?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Job Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {job.job_photos.map((p, i) => (
              <img key={i} src={p.url} alt="" className="h-24 w-24 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {nextAction && (
        <Button className="w-full" size="lg" loading={updating} onClick={handleStatusUpdate}>
          {NEXT_LABEL[job.status]}
        </Button>
      )}

      {['accepted','en_route','in_progress','completed'].includes(job.status) && (
        <JobChat jobId={id} currentUserId={user?.id} />
      )}
    </div>
  );
}
