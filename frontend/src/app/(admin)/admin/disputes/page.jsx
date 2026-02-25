'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, jobsApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const ACTION_OPTIONS = [
  { value: 'full_refund',    label: 'Full Refund' },
  { value: 'partial_refund', label: 'Partial Refund' },
  { value: 'no_action',      label: 'No Action' },
  { value: 'worker_warning', label: 'Warn Worker' },
];

export default function AdminDisputesPage() {
  const { showToast } = useToast();
  const [disputes, setDisputes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selected, setSelected]     = useState(null);
  const [resolution, setResolution] = useState('');
  const [action, setAction]         = useState('no_action');
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = () => {
    setLoading(true);
    setFetchError('');
    jobsApi.list({ status: 'disputed' })
      .then(({ data }) => setDisputes(data.data ?? []))
      .catch(() => setFetchError('Failed to load disputes. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDisputes, []);

  const openResolve = (d) => {
    setSelected(d);
    setResolution('');
    setAction('no_action');
  };

  const resolve = async () => {
    if (!selected) return;
    const disputeId = selected.dispute?.[0]?.id;
    if (!disputeId) {
      showToast('Dispute record not found for this job.', 'error');
      return;
    }
    setProcessing(true);
    try {
      await adminApi.resolveDispute(disputeId, { status: 'resolved', resolution, action });
      showToast('Dispute resolved successfully.', 'success');
      setSelected(null);
      fetchDisputes();
    } catch {
      showToast('Failed to resolve dispute. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Disputes</h1>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : fetchError ? (
        <div className="text-center py-16">
          <p className="text-danger-600 text-sm mb-3">{fetchError}</p>
          <button onClick={fetchDisputes} className="text-sm text-brand-600 hover:underline font-medium">
            Try again
          </button>
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-gray-500">No open disputes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{d.category}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1 truncate">{d.location_address}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge status="disputed" />
                <div className="flex gap-2">
                  {d.dispute?.[0]?.id && (
                    <Link href={`/admin/disputes/${d.dispute[0].id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                  <Button size="sm" onClick={() => openResolve(d)}>Resolve</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} title="Resolve Dispute" onClose={() => setSelected(null)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Job: <span className="font-medium">{selected?.description?.slice(0, 60)}{selected?.description?.length > 60 ? '…' : ''}</span></p>
          <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)} options={ACTION_OPTIONS} />
          <Textarea label="Resolution notes" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the resolution…" required />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Cancel</Button>
            <Button className="flex-1" loading={processing} disabled={!resolution.trim()} onClick={resolve}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
