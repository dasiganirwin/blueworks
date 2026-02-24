'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active',           label: 'Active' },
  { value: 'suspended',        label: 'Suspended' },
];

export default function AdminWorkersPage() {
  const [workers, setWorkers]   = useState([]);
  const [filter, setFilter]     = useState('pending_approval');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // { worker, action }
  const [processing, setProcessing] = useState(false);

  const fetchWorkers = () => {
    setLoading(true);
    adminApi.listWorkers({ status: filter })
      .then(({ data }) => setWorkers(data.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchWorkers, [filter]);

  const handleAction = async () => {
    if (!modal) return;
    setProcessing(true);
    try {
      await adminApi.updateWorker(modal.worker.id, { status: modal.action === 'approve' ? 'active' : 'suspended' });
      setModal(null);
      fetchWorkers();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Workers</h1>
        <div className="w-48">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : workers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No workers with this status.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Name','Phone','Email','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workers.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                  <td className="px-4 py-3 text-gray-600">{w.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{w.email ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={w.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {w.status !== 'active' && (
                        <Button size="sm" onClick={() => setModal({ worker: w, action: 'approve' })}>Approve</Button>
                      )}
                      {w.status !== 'suspended' && (
                        <Button size="sm" variant="danger" onClick={() => setModal({ worker: w, action: 'suspend' })}>Suspend</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!modal}
        title={modal?.action === 'approve' ? 'Approve Worker' : 'Suspend Worker'}
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-gray-600 mb-4">
          {modal?.action === 'approve'
            ? `Approve ${modal?.worker?.name}? They will be able to accept jobs.`
            : `Suspend ${modal?.worker?.name}? They will lose access immediately.`}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
          <Button
            className="flex-1"
            variant={modal?.action === 'suspend' ? 'danger' : 'primary'}
            loading={processing}
            onClick={handleAction}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
