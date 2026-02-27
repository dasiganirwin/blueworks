'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi, workersApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { JobCard } from '@/components/jobs/JobCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function WorkerDashboard() {
  const { user } = useAuthContext();
  const [activeJobs, setActiveJobs]       = useState([]);
  const [availability, setAvailability]   = useState('offline');
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [totalEarned, setTotalEarned]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const router = useRouter();

  const loadDashboard = () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    Promise.all([
      jobsApi.list({ status: 'accepted,en_route,in_progress' }),
      workersApi.getById(user.id),
      workersApi.getEarnings(),
    ]).then(([jobs, worker, earnings]) => {
      setActiveJobs(jobs.data.data ?? []);
      if (worker.data?.availability_status) {
        setAvailability(worker.data.availability_status);
      }
      if (earnings.data?.summary?.total_earned != null) {
        setTotalEarned(earnings.data.summary.total_earned);
      }
    }).catch(() => setError('Failed to load dashboard. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleAvailability = async () => {
    const next = availability === 'online' ? 'offline' : 'online';
    setTogglingAvail(true);
    try {
      await workersApi.updateAvailability(next);
      setAvailability(next);
    } catch {
      /* silently ignore — availability UI reverts on next load */
    } finally {
      setTogglingAvail(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hi, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500">Ready to work?</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={availability} />
          <Button
            size="sm"
            variant={availability === 'online' ? 'secondary' : 'primary'}
            loading={togglingAvail}
            onClick={toggleAvailability}
          >
            {availability === 'online' ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <p className="text-xs text-gray-500">Active Jobs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeJobs.length}</p>
        </Card>
        <Card onClick={() => router.push('/worker/earnings')}>
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalEarned != null
              ? `₱${Number(totalEarned).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : '₱0.00'}
          </p>
          <p className="text-xs text-brand-600 mt-1">View all →</p>
        </Card>
      </div>

      {/* Active jobs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Active Jobs</h2>
        <Button size="sm" variant="outline" onClick={() => router.push('/worker/jobs/nearby')}>Find Jobs</Button>
      </div>

      {error ? (
        <div className="text-center py-10">
          <p className="text-sm text-danger-600 mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={loadDashboard}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : activeJobs.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No active jobs. Go online to receive requests.</div>
      ) : (
        <div className="space-y-3">
          {activeJobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => router.push(`/worker/jobs/${job.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
