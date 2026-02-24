'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

export default function CustomerDashboard() {
  const { user }       = useAuthContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    jobsApi.list({ limit: 5 })
      .then(({ data }) => setJobs(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Hi, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500">What do you need help with today?</p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            href={`/jobs/new?category=${cat}`}
            className="flex flex-col items-center gap-1 bg-white border border-gray-200 rounded-xl p-3 hover:border-brand-400 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
            <span className="text-xs text-gray-600 text-center capitalize">{cat}</span>
          </Link>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
        <Link href="/jobs" className="text-sm text-brand-600 hover:underline">See all</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs yet.</p>
          <Button onClick={() => router.push('/jobs/new')}>Post your first job</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORY_ICONS = {
  plumber:      '🔧',
  electrician:  '⚡',
  carpenter:    '🪚',
  welder:       '🔥',
  painter:      '🖌️',
  'aircon-tech':'❄️',
  mason:        '🧱',
  general:      '🛠️',
};
