'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobsApi, paymentsApi, disputesApi, ratingsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JobChat } from '@/components/jobs/JobChat';
import { JobMap } from '@/components/ui/JobMap';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function CustomerJobDetailPage() {
  const { id }          = useParams();
  const { user }        = useAuthContext();
  const { showToast }   = useToast();
  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [payModal, setPayModal]     = useState(false);
  const [payMethod, setPayMethod]   = useState('card');
  const [payAmount, setPayAmount]   = useState('');
  const [payError, setPayError]     = useState('');
  const [processing, setProcessing]       = useState(false);
  const [paid, setPaid]                   = useState(false);
  const [myRating, setMyRating]           = useState(null);
  const [ratingValue, setRatingValue]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]       = useState(false);
  const [disputeModal, setDisputeModal]   = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError]   = useState('');
  const [disputeFiled, setDisputeFiled]   = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const { subscribeToJob } = useWebSocket({
    'job.status_changed': ({ job_id, status }) => {
      if (job_id === id) setJob(j => j ? { ...j, status } : j);
    },
    'worker.location_updated': ({ job_id, lat, lng }) => {
      if (job_id === id) setJob(j => j ? { ...j, worker_lat: lat, worker_lng: lng } : j);
    },
  });

  useEffect(() => {
    jobsApi.getById(id)
      .then(({ data }) => setJob(data))
      .finally(() => setLoading(false));
    subscribeToJob(id);
    ratingsApi.getMyRating(id).then(({ data }) => {
      if (data) { setMyRating(data); setRatingDone(true); setRatingValue(data.rating); }
    }).catch(() => {});
  }, [id]);

  const cancelJob = async () => {
    setCancelError('');
    setProcessing(true);
    try {
      const { data } = await jobsApi.updateStatus(id, 'cancelled');
      setJob(data);
      setCancelModal(false);
      showToast('Job cancelled.', 'success');
    } catch (err) {
      setCancelError(err.response?.data?.error?.message ?? 'Failed to cancel. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const initiatePayment = async () => {
    setPayError('');
    const amount = parseFloat(payAmount);
    if (!payAmount || isNaN(amount) || amount < 50) {
      setPayError('Minimum payment is ₱50.');
      return;
    }
    if (amount > 500000) {
      setPayError('Maximum payment is ₱500,000.');
      return;
    }
    setProcessing(true);
    try {
      const { data } = await paymentsApi.initiate({ job_id: id, method: payMethod, amount, currency: 'PHP' });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setPaid(true);
        setPayModal(false);
        showToast('Payment recorded. The worker will confirm cash receipt.', 'success');
      }
    } catch (err) {
      setPayError(err.response?.data?.error?.message ?? 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="page-container"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!job)    return <div className="page-container"><p className="text-gray-500">Job not found.</p></div>;

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

  const canCancel   = ['pending', 'accepted'].includes(job.status);
  const canPay      = job.status === 'completed' && !paid;
  const canDispute  = job.status === 'completed' && !disputeFiled;

  const fileDispute = async () => {
    if (!disputeReason.trim()) { setDisputeError('Please describe the issue.'); return; }
    setDisputeError('');
    setDisputeSubmitting(true);
    try {
      await disputesApi.create({ job_id: id, reason: disputeReason.trim() });
      setDisputeFiled(true);
      setDisputeModal(false);
      showToast('Dispute filed. Our team will review it shortly.', 'success');
    } catch (err) {
      setDisputeError(err.response?.data?.error?.message ?? 'Failed to file dispute. Please try again.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="page-container space-y-4">
      <Link href="/jobs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to My Jobs
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/dashboard" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <Link href="/jobs" className="hover:text-brand-600">My Jobs</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Job Detail</span>
      </nav>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-brand-600 uppercase">{job.category}</p>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5">{job.description.slice(0, 60)}{job.description.length > 60 ? '…' : ''}</h1>
        </div>
        <Badge status={job.status} />
      </div>

      {/* Status timeline — show pill for terminal non-standard statuses */}
      <Card>
        {['cancelled', 'disputed'].includes(job.status) ? (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${job.status === 'cancelled' ? 'bg-gray-400' : 'bg-yellow-500'}`} />
            <span className={`text-xs font-medium capitalize ${job.status === 'cancelled' ? 'text-gray-500' : 'text-yellow-700'}`}>
              {job.status}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_ORDER.map((s, i, arr) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${STATUS_ORDER.indexOf(job.status) >= i ? 'bg-brand-600' : 'bg-gray-200'}`} />
                <span className={`text-xs ${STATUS_ORDER.indexOf(job.status) >= i ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                  {s.replace('_', ' ')}
                </span>
                {i < arr.length - 1 && <span className="text-gray-200 text-xs">→</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Worker info */}
      {job.worker && (
        <Card>
          <p className="text-xs text-gray-500 mb-1">Assigned Worker</p>
          <Link href={`/workers/${job.worker_id}`} className="font-semibold text-brand-600 hover:underline">
            {job.worker.name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Tap to view profile</p>
        </Card>
      )}

      {/* Location */}
      <Card>
        <p className="text-xs text-gray-500 mb-1">Location</p>
        <p className="text-sm">{job.location_address}</p>
      </Card>

      {/* Scheduled time — shown for scheduled jobs */}
      {job.scheduled_at && (
        <Card>
          <p className="text-xs text-gray-500 mb-1">Scheduled For</p>
          <p className="text-sm font-medium">
            {new Date(job.scheduled_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </Card>
      )}

      {/* Worker location map — live when en_route or in_progress */}
      {['en_route', 'in_progress'].includes(job.status) && job.worker_lat && job.worker_lng && (
        <JobMap
          lat={job.worker_lat}
          lng={job.worker_lng}
          label="Worker location (live)"
          markerColor="16a34a"
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <Button variant="outline" className="flex-1" onClick={() => setCancelModal(true)}>
            Cancel Job
          </Button>
        )}
        {canPay && (
          <Button className="flex-1" onClick={() => setPayModal(true)}>
            Pay Now
          </Button>
        )}
        {paid && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Payment submitted — awaiting worker confirmation
          </div>
        )}
        {canDispute && (
          <Button variant="outline" className="flex-1 text-warning-600 border-warning-200 hover:bg-warning-50" onClick={() => setDisputeModal(true)}>
            File Dispute
          </Button>
        )}
        {disputeFiled && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-700 text-sm font-medium">
            Dispute filed — under review
          </div>
        )}
      </div>

      {/* Rate the worker */}
      {job.status === 'completed' && job.worker && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            {ratingDone ? 'Your Rating' : 'Rate the Worker'}
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

      {/* Chat */}
      {['accepted','en_route','in_progress','completed'].includes(job.status) && (
        <JobChat jobId={id} currentUserId={user?.id} readOnly={['completed','cancelled'].includes(job.status)} />
      )}

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} title="Cancel Job?" onClose={() => { setCancelModal(false); setCancelError(''); }}>
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to cancel this job?</p>
        {cancelError && (
          <div role="alert" className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-3 py-2 rounded-lg mb-3">{cancelError}</div>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { setCancelModal(false); setCancelError(''); }}>Keep Job</Button>
          <Button variant="danger" className="flex-1" loading={processing} onClick={cancelJob}>Yes, Cancel</Button>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal isOpen={payModal} title="Pay for Job" onClose={() => { setPayModal(false); setPayError(''); setPayAmount(''); }}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Amount (₱ PHP)</label>
            <input
              type="number"
              min="50"
              max="500000"
              step="0.01"
              placeholder="Amount in ₱ PHP, e.g. 850"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Fee breakdown — shown only when a valid positive amount is entered */}
          {(() => {
            const amt = parseFloat(payAmount);
            if (!payAmount || isNaN(amt) || amt <= 0) return null;
            const fee   = amt * 0.05;
            const total = amt + fee;
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{amt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee (5%)</span>
                  <span>₱{fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}

          <p className="text-sm text-gray-600">Choose payment method:</p>

          {/* Card option */}
          <label htmlFor="pay-card" className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-400">
            <input id="pay-card" type="radio" name="method" value="card" checked={payMethod === 'card'} onChange={() => setPayMethod('card')} />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path strokeLinecap="round" d="M2 10h20" />
              <path strokeLinecap="round" strokeWidth={2.5} d="M6 15h3" />
            </svg>
            <span className="text-sm font-medium">Card (Stripe)</span>
          </label>

          {/* Cash option */}
          <label htmlFor="pay-cash" className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-400">
            <input id="pay-cash" type="radio" name="method" value="cash" checked={payMethod === 'cash'} onChange={() => setPayMethod('cash')} />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="7" width="20" height="10" rx="1.5" />
              <circle cx="12" cy="12" r="2.5" />
              <path strokeLinecap="round" d="M6 12h.01M18 12h.01" />
            </svg>
            <span className="text-sm font-medium">Cash on Service</span>
          </label>
          {payError && (
            <div role="alert" className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-3 py-2 rounded-lg">{payError}</div>
          )}
          <Button className="w-full mt-2" loading={processing} onClick={initiatePayment}>Confirm Payment</Button>
        </div>
      </Modal>
    </div>
  );
}

      {/* Dispute modal */}
      <Modal isOpen={disputeModal} title="File a Dispute" onClose={() => { setDisputeModal(false); setDisputeError(''); setDisputeReason(''); }}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Describe the issue with this job. Our team will review and respond within 24 hours.</p>
          <textarea
            value={disputeReason}
            onChange={(e) => { setDisputeReason(e.target.value); setDisputeError(''); }}
            placeholder="e.g. Worker did not complete the job properly…"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
          />
          {disputeError && (
            <div role="alert" className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-3 py-2 rounded-lg">{disputeError}</div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setDisputeModal(false); setDisputeError(''); setDisputeReason(''); }}>Cancel</Button>
            <Button className="flex-1" loading={disputeSubmitting} onClick={fileDispute}>Submit Dispute</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const STATUS_ORDER = ['pending','accepted','en_route','in_progress','completed'];
