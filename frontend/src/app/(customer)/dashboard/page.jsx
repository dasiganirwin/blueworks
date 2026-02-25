'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

const CATEGORY_LABELS = {
  plumber:      'Plumber',
  electrician:  'Electrician',
  carpenter:    'Carpenter',
  welder:       'Welder',
  painter:      'Painter',
  'aircon-tech':'Aircon Tech',
  mason:        'Mason',
  general:      'General',
};

export default function CustomerDashboard() {
  const { user }       = useAuthContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    jobsApi.list({ limit: 5 })
      .then(({ data }) => setJobs(data.data ?? []))
      .catch(() => { /* leave list empty */ })
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
            aria-label={CATEGORY_LABELS[cat]}
            className="flex flex-col items-center gap-1 bg-white border border-gray-200 rounded-xl p-3 hover:border-brand-400 hover:shadow-sm transition-all"
          >
            <span className="text-brand-600">{CATEGORY_ICONS[cat]}</span>
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
  plumber: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C10.343 2 9 3.343 9 5c0 1.306.835 2.418 2 2.83V19a1 1 0 0 0 2 0V7.83C14.165 7.418 15 6.306 15 5c0-1.657-1.343-3-3-3z" />
      <path d="M9 14H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4" />
    </svg>
  ),
  electrician: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H11L10 22l9-12h-6.5L13 2z" />
    </svg>
  ),
  carpenter: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4l5 5-11 11H4v-5L15 4z" />
      <path d="M14 5l5 5" />
    </svg>
  ),
  welder: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z" />
      <path d="M12 12v4" />
      <path d="M9 18h6" />
    </svg>
  ),
  painter: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h12v6H3z" />
      <path d="M9 9v3" />
      <path d="M9 12c-2 0-3 1-3 3s1 3 3 3 3-1 3-3v-3" />
      <path d="M12 15h4a2 2 0 0 0 0-4h-1" />
    </svg>
  ),
  'aircon-tech': (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20" />
      <path d="M5 5l14 14M19 5L5 19" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  mason: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="9" height="5" rx="1" />
      <rect x="13" y="5" width="9" height="5" rx="1" />
      <rect x="6" y="14" width="9" height="5" rx="1" />
      <rect x="2" y="14" width="2" height="5" rx="1" />
      <rect x="17" y="14" width="5" height="5" rx="1" />
    </svg>
  ),
  general: (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};
