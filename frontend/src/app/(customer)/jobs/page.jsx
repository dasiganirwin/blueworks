'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = [
  { value: '',            label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

export default function JobsListPage() {
  const [jobs, setJobs]       = useState([]);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const router = useRouter();
  const LIMIT  = 10;

  useEffect(() => {
    setLoading(true);
    jobsApi.list({ status: status || undefined, page, limit: LIMIT })
      .then(({ data }) => { setJobs(data.data ?? []); setTotal(data.meta?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [status, page]);

  const handleStatusChange = (val) => { setStatus(val); setPage(1); };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
        <Button size="sm" onClick={() => router.push('/jobs/new')}>+ Post Job</Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleStatusChange(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path strokeLinecap="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <p className="text-sm text-gray-500">
            {status ? 'No jobs match this filter.' : 'No jobs yet.'}
          </p>
          {!status && (
            <Button size="sm" onClick={() => router.push('/jobs/new')}>Post your first job</Button>
          )}
        </div>
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
