'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, disputesApi } from '@/lib/api';
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
  const [disputes, setDisputes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selected, setSelected]   = useState(null);
  const [resolution, setResolution] = useState('');
  const [action, setAction]       = useState('no_action');
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = () => {
    setLoading(true);
    setFetchError('');
    // Reuse jobs list filtered by disputed status for MVP
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?status=disputed`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setDisputes(d.data ?? []))
      .catch(() => setFetchError('Failed to load disputes. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDisputes, []);

  const resolve = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      // Get the dispute for this job
      const disputeRes = await disputesApi.getById(selected.dispute_id);
      await adminApi.resolveDispute(disputeRes.data.id, { status: 'resolved', resolution, action });
      showToast('Dispute resolved successfully.', 'success');
      setSelected(null);
      fetchDisputes();
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
        <div className="text-center py-16 text-gray-400">No open disputes.</div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase">{d.category}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{d.description?.slice(0, 80)}</p>
                <p className="text-xs text-gray-400 mt-1">{d.location_address}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge status="disputed" />
                <div className="flex gap-2">
                  {d.dispute_id && (
                    <Link href={`/admin/disputes/${d.dispute_id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                  <Button size="sm" onClick={() => setSelected(d)}>Resolve</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} title="Resolve Dispute" onClose={() => setSelected(null)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Job: <span className="font-medium">{selected?.description?.slice(0,60)}</span></p>
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
