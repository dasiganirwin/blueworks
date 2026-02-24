'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [loading, setLoading]     = useState(true);

  const fetch = () => {
    setLoading(true);
    adminApi.getAnalytics({ from: from || undefined, to: to || undefined })
      .then(({ data }) => setAnalytics(data))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const jobStats = [
    { label: 'Total Jobs',      value: analytics?.jobs?.total },
    { label: 'Completed',       value: analytics?.jobs?.completed },
    { label: 'Cancelled',       value: analytics?.jobs?.cancelled },
    { label: 'Disputed',        value: analytics?.jobs?.disputed },
    { label: 'Completion Rate', value: analytics?.jobs?.completion_rate != null ? `${(analytics.jobs.completion_rate * 100).toFixed(1)}%` : null },
  ];

  const userStats = [
    { label: 'Active Customers',    value: analytics?.users?.active_customers },
    { label: 'Active Workers',      value: analytics?.users?.active_workers },
    { label: 'New Registrations',   value: analytics?.users?.new_registrations },
  ];

  return (
    <div className="admin-container">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Analytics</h1>

      <div className="flex gap-3 items-end mb-6">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input label="To"   type="date" value={to}   onChange={(e) => setTo(e.target.value)}   className="w-40" />
        <Button onClick={fetch} loading={loading}>Apply</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_,i)=><div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
      ) : (
        <>
          <h2 className="font-semibold text-gray-700 mb-3">Jobs</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {jobStats.map(({ label, value }) => (
              <Card key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
              </Card>
            ))}
          </div>

          <h2 className="font-semibold text-gray-700 mb-3">Users</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {userStats.map(({ label, value }) => (
              <Card key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
              </Card>
            ))}
          </div>

          <h2 className="font-semibold text-gray-700 mb-3">Payments</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-xs text-gray-500">Total Volume</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                ₱{Number(analytics?.payments?.total_volume ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {analytics?.payments?.success_rate != null ? `${(analytics.payments.success_rate * 100).toFixed(1)}%` : '—'}
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
