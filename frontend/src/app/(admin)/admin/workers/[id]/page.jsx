'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, workersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

export default function AdminWorkerProfilePage() {
  const { id }     = useParams();
  const router     = useRouter();
  const [worker, setWorker]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(null); // 'approve' | 'suspend'
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    workersApi.getById(id)
      .then(({ data }) => setWorker(data))
      .catch(() => setError('Could not load worker profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async () => {
    if (!modal) return;
    setProcessing(true);
    try {
      await adminApi.updateWorker(id, {
        status: modal === 'approve' ? 'active' : 'suspended',
      });
      setModal(null);
      router.back();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="admin-container">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3"
        >
          &larr; Back to Workers
        </button>
        <div className="text-center py-16 text-gray-400">{error ?? 'Worker not found.'}</div>
      </div>
    );
  }

  return (
    <div className="admin-container space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3"
      >
        &larr; Back to Workers
      </button>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/admin" className="hover:text-brand-600">Admin</Link>
        <span>/</span>
        <Link href="/admin/workers" className="hover:text-brand-600">Workers</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Worker Profile</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{worker.name}</h1>
        <Badge status={worker.status} />
      </div>

      {/* Identity */}
      <Card>
        <CardHeader title="Profile" />
        <div className="space-y-3">
          <InfoRow label="Name"   value={worker.name} />
          <InfoRow label="Phone"  value={worker.phone} />
          <InfoRow label="Email"  value={worker.email} />
          <InfoRow label="Skills" value={Array.isArray(worker.skills) ? worker.skills.join(', ') : worker.skills} />
          <InfoRow label="Bio"    value={worker.bio} />
        </div>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader title="Status" />
        <div className="space-y-3">
          <InfoRow label="Account Status"       value={worker.status} />
          <InfoRow label="Availability Status"  value={worker.availability_status} />
          <InfoRow
            label="Total Jobs Completed"
            value={
              (worker.completed_jobs_count ?? worker.total_jobs) != null
                ? String(worker.completed_jobs_count ?? worker.total_jobs)
                : null
            }
          />
          <InfoRow
            label="Rating"
            value={
              (worker.rating ?? worker.average_rating) != null
                ? `\u2605 ${Number(worker.rating ?? worker.average_rating).toFixed(1)}`
                : null
            }
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {worker.status === 'pending_approval' && (
          <Button className="flex-1" onClick={() => setModal('approve')}>
            Approve Worker
          </Button>
        )}
        {worker.status === 'active' && (
          <Button variant="danger" className="flex-1" onClick={() => setModal('suspend')}>
            Suspend Worker
          </Button>
        )}
      </div>

      <Modal
        isOpen={!!modal}
        title={modal === 'approve' ? 'Approve Worker' : 'Suspend Worker'}
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-gray-600 mb-4">
          {modal === 'approve'
            ? `Approve ${worker.name}? They will be able to accept jobs.`
            : `Suspend ${worker.name}? They will lose access immediately.`}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
          <Button
            className="flex-1"
            variant={modal === 'suspend' ? 'danger' : 'primary'}
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
