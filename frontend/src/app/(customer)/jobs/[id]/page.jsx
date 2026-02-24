'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { jobsApi, paymentsApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JobChat } from '@/components/jobs/JobChat';
import { Modal } from '@/components/ui/Modal';

export default function CustomerJobDetailPage() {
  const { id }    = useParams();
  const { user }  = useAuthContext();
  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [payModal, setPayModal]     = useState(false);
  const [payMethod, setPayMethod]   = useState('card');
  const [payAmount, setPayAmount]   = useState('');
  const [payError, setPayError]     = useState('');
  const [processing, setProcessing] = useState(false);

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
  }, [id]);

  const cancelJob = async () => {
    setCancelError('');
    setProcessing(true);
    try {
      const { data } = await jobsApi.updateStatus(id, 'cancelled');
      setJob(data);
      setCancelModal(false);
    } catch (err) {
      setCancelError(err.response?.data?.error?.message ?? 'Failed to cancel. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const initiatePayment = async () => {
    setPayError('');
    const amount = parseFloat(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0) {
      setPayError('Please enter a valid amount.');
      return;
    }
    setProcessing(true);
    try {
      const { data } = await paymentsApi.initiate({ job_id: id, method: payMethod, amount, currency: 'PHP' });
      if (data.payment_url) window.location.href = data.payment_url;
      else setPayModal(false);
    } catch (err) {
      setPayError(err.response?.data?.error?.message ?? 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="page-container"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!job)    return <div className="page-container"><p className="text-gray-500">Job not found.</p></div>;

  const canCancel = ['pending', 'accepted'].includes(job.status);
  const canPay    = job.status === 'completed';

  return (
    <div className="page-container space-y-4">
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
          <p className="font-semibold">{job.worker.name}</p>
        </Card>
      )}

      {/* Location */}
      <Card>
        <p className="text-xs text-gray-500 mb-1">Location</p>
        <p className="text-sm">{job.location_address}</p>
      </Card>

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
      </div>

      {/* Chat */}
      {['accepted','en_route','in_progress','completed'].includes(job.status) && (
        <JobChat jobId={id} currentUserId={user?.id} />
      )}

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} title="Cancel Job?" onClose={() => { setCancelModal(false); setCancelError(''); }}>
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to cancel this job?</p>
        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{cancelError}</div>
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Amount (₱)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 850"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <p className="text-sm text-gray-600">Choose payment method:</p>
          {['card', 'cash'].map(m => (
            <label key={m} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-400">
              <input type="radio" name="method" value={m} checked={payMethod === m} onChange={() => setPayMethod(m)} />
              <span className="capitalize text-sm font-medium">{m === 'card' ? 'Card (Stripe)' : 'Cash on Service'}</span>
            </label>
          ))}
          {payError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{payError}</div>
          )}
          <Button className="w-full mt-2" loading={processing} onClick={initiatePayment}>Confirm Payment</Button>
        </div>
      </Modal>
    </div>
  );
}

const STATUS_ORDER = ['pending','accepted','en_route','in_progress','completed'];
