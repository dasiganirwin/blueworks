'use client';
import { useState, useEffect } from 'react';
import { workersApi } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';

export default function EarningsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workersApi.getEarnings().then(({ data: res }) => setData(res)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;

  return (
    <div className="page-container space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₱{data?.summary?.total_earned?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) ?? '0.00'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Currency</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{data?.summary?.currency ?? 'PHP'}</p>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Transaction History</h2>
        {(data?.data ?? []).length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No transactions yet.</div>
        ) : (
          <div className="space-y-2">
            {data.data.map(tx => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Job #{tx.job_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{tx.method} · {new Date(tx.paid_at).toLocaleDateString('en-PH')}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">+₱{Number(tx.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
