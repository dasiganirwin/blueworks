'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending',     label: 'Pending' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

export default function JobsListPage() {
  const [jobs, setJobs]           = useState([]);
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const router = useRouter();
  const LIMIT  = 10;

  useEffect(() => {
    setLoading(true);
    jobsApi.list({ status: status || undefined, page, limit: LIMIT })
      .then(({ data }) => { setJobs(data.data ?? []); setTotal(data.meta?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
        <Button size="sm" onClick={() => router.push('/jobs/new')}>+ Post Job</Button>
      </div>

      <div className="mb-4">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={STATUS_OPTIONS}
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No jobs found.</div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
            ))}
          </div>
          {total > LIMIT && (
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-500 flex items-center">{page} / {Math.ceil(total / LIMIT)}</span>
              <Button variant="secondary" size="sm" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
