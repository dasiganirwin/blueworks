'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { disputesApi, jobsApi, usersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function DisputeDetailPage() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [job, setJob]         = useState(null);
  const [raisedBy, setRaisedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const { data: disputeData } = await disputesApi.getById(id);
        setDispute(disputeData);

        // Fetch job info if job_id is available
        if (disputeData?.job_id) {
          jobsApi.getById(disputeData.job_id)
            .then(({ data: jobData }) => setJob(jobData))
            .catch(() => {});
        }

        // Fetch user who raised the dispute
        if (disputeData?.raised_by) {
          usersApi.getById(disputeData.raised_by)
            .then(({ data: userData }) => setRaisedBy(userData))
            .catch(() => {});
        }
      } catch {
        setError('Could not load dispute.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="admin-container space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="admin-container">
        <Link href="/admin/disputes" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
          &larr; Back to Disputes
        </Link>
        <div className="text-center py-16 text-gray-400">{error ?? 'Dispute not found.'}</div>
      </div>
    );
  }

  const isResolved = dispute.status === 'resolved';

  return (
    <div className="admin-container space-y-5">
      <Link href="/admin/disputes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to Disputes
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/admin" className="hover:text-brand-600">Admin</Link>
        <span>/</span>
        <Link href="/admin/disputes" className="hover:text-brand-600">Disputes</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Dispute Detail</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dispute Detail</h1>
        <Badge status={dispute.status} />
      </div>

      {/* Job Info */}
      <Card>
        <CardHeader title="Job Information" />
        <div className="space-y-3">
          <InfoRow label="Category" value={job?.category ?? dispute.job_category} />
          <InfoRow label="Description" value={job?.description ?? dispute.job_description} />
          <InfoRow label="Location" value={job?.location_address ?? dispute.job_location} />
          {job?.id && (
            <InfoRow label="Job ID" value={job.id} />
          )}
        </div>
      </Card>

      {/* Dispute Details */}
      <Card>
        <CardHeader title="Complaint" />
        <div className="space-y-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Raised By</p>
            <p className="text-sm text-gray-900">
              {raisedBy?.name ?? raisedBy?.email ?? dispute.raised_by ?? '—'}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{dispute.reason ?? '—'}</p>
          </div>
        </div>
      </Card>

      {/* Resolution (only when resolved) */}
      {isResolved && (
        <Card>
          <CardHeader title="Resolution" />
          <div className="space-y-3">
            <InfoRow label="Resolution Notes" value={dispute.resolution} />
            <InfoRow label="Action Taken" value={dispute.action?.replace(/_/g, ' ')} />
            <InfoRow label="Resolved By" value={dispute.resolved_by} />
            <InfoRow label="Resolved At" value={formatDateTime(dispute.resolved_at)} />
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader title="Timeline" />
        <div className="space-y-3">
          <InfoRow label="Created At" value={formatDateTime(dispute.created_at)} />
          <InfoRow label="Last Updated" value={formatDateTime(dispute.updated_at)} />
        </div>
      </Card>
    </div>
  );
}
