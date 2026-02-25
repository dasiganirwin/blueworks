'use client';
import { useState, useEffect, useMemo } from 'react';
import { workersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed',  label: 'Disputed' },
  { value: 'refunded',  label: 'Refunded' },
];

export default function EarningsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    workersApi.getEarnings()
      .then(({ data: res }) => setData(res))
      .catch(() => { /* leave data null — empty state will render */ })
      .finally(() => setLoading(false));
  }, []);

  const transactions = useMemo(() => {
    const raw = (data?.data ?? []).slice().sort(
      (a, b) => new Date(b.created_at ?? b.paid_at) - new Date(a.created_at ?? a.paid_at)
    );

    return raw.filter(tx => {
      const txDate = new Date(tx.created_at ?? tx.paid_at);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (txDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) return false;
      }

      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      return true;
    });
  }, [data, fromDate, toDate, statusFilter]);

  const hasActiveFilters = fromDate || toDate || statusFilter !== 'all';

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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter Transactions</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="From"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={e => setFromDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label="Status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); setStatusFilter('all'); }}
              className="text-xs text-brand-600 hover:underline pb-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Transaction History</h2>

        {(data?.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-3">
            <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path strokeLinecap="round" d="M2 10h20M6 15h3" />
            </svg>
            <p className="text-sm text-gray-500">No transactions yet. Complete a job to see your earnings here.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-2">
            <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M3 6l9 6 9-6M3 18l9-6 9 6" />
            </svg>
            <p className="text-sm text-gray-500">No results for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Job #{tx.job_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">
                    {tx.method} · {new Date(tx.paid_at).toLocaleDateString('en-PH')}
                  </p>
                  {tx.status && tx.status !== 'completed' && (
                    <div className="mt-1">
                      <Badge status={tx.status} />
                    </div>
                  )}
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
