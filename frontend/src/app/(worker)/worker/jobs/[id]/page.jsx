'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { jobsApi, ratingsApi, paymentsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { useAuthContext } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JobChat } from '@/components/jobs/JobChat';
import { JobMap } from '@/components/ui/JobMap';

const NEXT_STATUS = { pending: 'accepted', accepted: 'en_route', en_route: 'in_progress', in_progress: 'completed' };

const ACTION_CONFIG = {
  pending: {
    label: 'Accept Job',
    subtitle: "Confirm you're taking this job",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  accepted: {
    label: 'Start Navigation',
    subtitle: 'Tap when you leave for the job',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" />
        <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  en_route: {
    label: 'Start Work',
    subtitle: 'Tap when you arrive and begin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a1 1 0 0 1 2 0v1h2a1 1 0 0 1 .707 1.707l-1.5 1.5A5.978 5.978 0 0 1 15 11v6a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-6a5.978 5.978 0 0 1 .793-2.793l-1.5-1.5A1 1 0 0 1 9 5h2V4z" />
      </svg>
    ),
  },
  in_progress: {
    label: 'Mark Complete',
    subtitle: 'Tap when the job is finished',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.9-5.7A8.38 8.38 0 0 1 3 12a9 9 0 1 1 9 9 8.38 8.38 0 0 1-3.3-.676L3 21z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
};

export default function WorkerJobDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user } = useAuthContext();
  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejecting, setRejecting]   = useState(false);
  const [myRating, setMyRating]     = useState(null);
  const [ratingValue, setRatingValue]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [cashConfirming, setCashConfirming] = useState(false);
  const [cashConfirmed, setCashConfirmed]   = useState(false);

  const { showToast } = useToast();
  const { sendLocationPing, subscribeToJob } = useWebSocket({
    'job.status_changed': ({ job_id, status }) => {
      if (job_id === id) setJob(j => j ? { ...j, status } : j);
    },
    'payment.confirmed': ({ job_id }) => {
      if (job_id === id) setCashConfirmed(true);
    },
  });

  useEffect(() => {
    jobsApi.getById(id)
      .then(({ data }) => setJob(data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
    subscribeToJob(id);
    ratingsApi.getMyRating(id).then(({ data }) => {
      if (data) { setMyRating(data); setRatingDone(true); setRatingValue(data.rating); }
    }).catch(() => {});
  }, [id]);

  // ── Broadcast worker location every 10s while en_route or in_progress ──────
  useEffect(() => {
    if (!job || !['en_route', 'in_progress'].includes(job.status)) return;
    if (!navigator?.geolocation) return;

    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => sendLocationPing(coords.latitude, coords.longitude, id),
        () => { /* ignore — no GPS or permission denied */ }
      );
    };

    ping(); // fire immediately on status entry
    const timer = setInterval(ping, 10_000);
    return () => clearInterval(timer);
  }, [job?.status, id, sendLocationPing]);

  const submitRating = async () => {
    if (!ratingValue) return;
    setRatingSubmitting(true);
    try {
      await ratingsApi.submit(id, { rating: ratingValue, comment: ratingComment.trim() || undefined });
      setRatingDone(true);
      showToast('Thanks for your rating!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message ?? 'Failed to submit rating.', 'error');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleCashConfirm = async () => {
    const payment = job.payment?.[0];
    if (!payment) return;
    setCashConfirming(true);
    try {
      await paymentsApi.cashConfirm(payment.id);
      setCashConfirmed(true);
      showToast('Cash receipt confirmed!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message ?? 'Failed to confirm. Please try again.', 'error');
    } finally {
      setCashConfirming(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await jobsApi.reject(id);
      showToast('Job rejected. The customer will be notified.', 'success');
      router.push('/worker/jobs/nearby');
    } catch (err) {
      showToast(err.response?.data?.error?.message ?? 'Failed to reject job. Please try again.', 'error');
    } finally {
      setRejecting(false);
      setRejectModal(false);
    }
  };

  const handleStatusUpdate = async () => {
    const next = NEXT_STATUS[job.status];
    if (!next) return;
    setUpdating(true);
    try {
      await jobsApi.updateStatus(id, next);
      const { data } = await jobsApi.getById(id);
      setJob(data);
    } catch (err) {
      showToast(err.response?.data?.error?.message ?? 'Failed to update status. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="page-container"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!job)    return <div className="page-container"><p className="text-gray-500">Job not found.</p></div>;

  const nextAction = NEXT_STATUS[job.status];

  return (
    <div className="page-container space-y-4">
      <Link href="/worker/jobs/nearby" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to Find Jobs
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/worker/dashboard" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Job Detail</span>
      </nav>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-brand-600 uppercase">{job.category}</p>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5">{job.description.slice(0, 80)}</h1>
        </div>
        <Badge status={job.status} />
      </div>

      <Card>
        <p className="text-xs text-gray-500 mb-1">Customer</p>
        <p className="font-semibold">{job.customer?.name}</p>
      </Card>

      <Card>
        <p className="text-xs text-gray-500 mb-1">Location</p>
        <p className="text-sm">{job.location_address}</p>
        {['en_route', 'in_progress'].includes(job.status) && job.location_lat && job.location_lng && (
          <a
            href={`https://maps.google.com/?q=${job.location_lat},${job.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-brand-600 font-medium hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </Card>

      {/* Customer location map — visible once job is accepted */}
      {['accepted', 'en_route', 'in_progress'].includes(job.status) && job.location_lat && job.location_lng && (
        <JobMap
          lat={job.location_lat}
          lng={job.location_lng}
          label="Customer location"
          markerColor="2563eb"
        />
      )}

      {job.job_photos?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Job Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {job.job_photos.map((p, i) => (
              <img key={i} src={p.url} alt={`Job photo ${i + 1}`} className="h-24 w-24 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {nextAction && (() => {
        const cfg = ACTION_CONFIG[job.status];
        return (
          <Button className="w-full" size="lg" loading={updating} onClick={handleStatusUpdate}>
            <span className="flex flex-col items-center gap-1 py-1">
              <span className="flex items-center gap-2">
                {cfg.icon}
                <span className="font-semibold">{cfg.label}</span>
              </span>
              <span className="text-xs font-normal opacity-80">{cfg.subtitle}</span>
            </span>
          </Button>
        );
      })()}

      {/* Rate the customer */}
      {job.status === 'completed' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {ratingDone ? 'Your Rating' : 'Rate the Customer'}
          </p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                type="button"
                disabled={ratingDone}
                onClick={() => !ratingDone && setRatingValue(star)}
                className={`text-2xl transition-colors ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'} ${!ratingDone ? 'hover:text-yellow-300' : ''}`}
              >★</button>
            ))}
          </div>
          {!ratingDone && (
            <>
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Leave a comment (optional)…"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"
              />
              <Button className="w-full" size="sm" loading={ratingSubmitting} disabled={!ratingValue} onClick={submitRating}>
                Submit Rating
              </Button>
            </>
          )}
          {ratingDone && myRating?.comment && (
            <p className="text-sm text-gray-500 italic">"{myRating.comment}"</p>
          )}
        </div>
      )}

      {/* Cash payment confirmation — visible when job is completed and payment is cash + pending */}
      {job.status === 'completed' && job.payment?.[0]?.method === 'cash' && (
        cashConfirmed || job.payment[0].status === 'completed' ? (
          <div className="flex items-center gap-2 py-3 px-4 bg-success-50 border border-success-200 rounded-xl text-success-700 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cash payment confirmed
          </div>
        ) : (
          <Button className="w-full" loading={cashConfirming} onClick={handleCashConfirm}>
            Confirm Cash Receipt
          </Button>
        )
      )}

      {/* Reject job — only available before going en_route */}
      {job.status === 'accepted' && (
        <Button variant="outline" className="w-full text-danger-600 border-danger-200 hover:bg-danger-50" onClick={() => setRejectModal(true)}>
          Reject Job
        </Button>
      )}

      {['accepted','en_route','in_progress','completed'].includes(job.status) && (
        <JobChat jobId={id} currentUserId={user?.id} readOnly={['completed','cancelled'].includes(job.status)} />
      )}

      {/* Reject confirmation modal */}
      <Modal isOpen={rejectModal} title="Reject this job?" onClose={() => setRejectModal(false)}>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to reject this job? The customer will be notified and the job will be made available to other workers.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setRejectModal(false)}>Keep Job</Button>
          <Button variant="danger" className="flex-1" loading={rejecting} onClick={handleReject}>Yes, Reject</Button>
        </div>
      </Modal>
    </div>
  );
}
