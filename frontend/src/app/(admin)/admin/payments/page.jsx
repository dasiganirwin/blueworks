'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = ['', 'pending', 'completed', 'refunded'];

export default function AdminPaymentsPage() {
  const [payments, setPayments]   = useState([]);
  const [meta, setMeta]           = useState(null);
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  const fetchPayments = (p = page, s = status) => {
    setLoading(true);
    adminApi.listPayments({ page: p, limit: 20, ...(s && { status: s }) })
      .then(({ data }) => { setPayments(data.data ?? []); setMeta(data.meta); })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleStatusChange = (s) => {
    setStatus(s);
    setPage(1);
    fetchPayments(1, s);
  };

  const handlePage = (next) => {
    setPage(next);
    fetchPayments(next, status);
  };

  const fmt = (amount) =>
    `₱${Number(amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—';

  return (
    <div className="admin-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500">{meta ? `${meta.total} total` : ''}</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-2">
          <p className="text-sm text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Worker</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.job_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-gray-700">{p.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{p.worker?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(p.amount)}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(p.paid_at ?? p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => handlePage(page - 1)}>Previous</Button>
          <span className="text-xs text-gray-500">Page {page} of {Math.ceil(meta.total / meta.limit)}</span>
          <Button variant="secondary" size="sm" disabled={page >= Math.ceil(meta.total / meta.limit)} onClick={() => handlePage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
