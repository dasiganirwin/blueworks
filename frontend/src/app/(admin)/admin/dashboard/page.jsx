'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    setError(false);
    adminApi.getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const stats = [
    { label: 'Total Jobs',       value: analytics?.jobs?.total ?? '—',            color: 'text-gray-900' },
    { label: 'Completed',        value: analytics?.jobs?.completed ?? '—',         color: 'text-green-600' },
    { label: 'Completion Rate',  value: analytics?.jobs?.completion_rate ? `${(analytics.jobs.completion_rate * 100).toFixed(1)}%` : '—', color: 'text-brand-600' },
    { label: 'Active Customers', value: analytics?.users?.active_customers ?? '—', color: 'text-gray-900' },
    { label: 'Active Workers',   value: analytics?.users?.active_workers ?? '—',   color: 'text-gray-900' },
    { label: 'Total Revenue',    value: analytics?.payments?.total_volume != null ? `₱${Number(analytics.payments.total_volume).toLocaleString()}` : '—', color: 'text-green-600' },
  ];

  return (
    <div className="admin-container">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Admin Overview</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-gray-500">Failed to load analytics.</p>
          <button onClick={fetchAnalytics} className="text-sm text-brand-600 hover:underline font-medium">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, color }) => (
            <Card key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/workers', label: 'Manage Workers', desc: 'Approve or suspend worker accounts' },
          { href: '/admin/disputes', label: 'Resolve Disputes', desc: 'Review and resolve open disputes' },
          { href: '/admin/analytics', label: 'Full Analytics', desc: 'Revenue, jobs, and user growth' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-brand-400 transition-colors">
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
