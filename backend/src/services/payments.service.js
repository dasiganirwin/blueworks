const supabase = require('../config/supabase');
const stripe   = require('../config/stripe');
const { Errors } = require('../utils/errors');
const { broadcast } = require('../websocket');
const notificationsService = require('./notifications.service');

async function initiatePayment(userId, userRole, { job_id, method, amount, currency }) {
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, worker_id, status')
    .eq('id', job_id)
    .maybeSingle();

  if (!job)                       throw Errors.NOT_FOUND('job');
  if (userRole !== 'admin' && job.customer_id !== userId) throw Errors.FORBIDDEN();
  if (job.status !== 'completed') throw Errors.JOB_NOT_COMPLETED();

  const customerId = job.customer_id;

  const { data: existing } = await supabase
    .from('payments')
    .select('id, status')
    .eq('job_id', job_id)
    .maybeSingle();

  if (existing && existing.status === 'completed') throw Errors.ALREADY_PAID();

  let payment_url = null;
  let gateway_transaction_id = null;
  const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  if (method === 'card') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: [{
        price_data: {
          currency:     currency.toLowerCase(),
          unit_amount:  Math.round(amount * 100),
          product_data: { name: `BlueWork Job #${job_id.slice(0, 8)}` },
        },
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL}/jobs/${job_id}?payment=success`,
      cancel_url:  `${process.env.APP_URL}/jobs/${job_id}?payment=cancelled`,
      metadata:    { job_id, customer_id: customerId },
    });

    payment_url             = session.url;
    gateway_transaction_id  = session.id;
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .upsert({
      job_id,
      customer_id:            customerId,
      worker_id:              job.worker_id,
      method,
      amount,
      currency,
      status:                 'pending',
      gateway_transaction_id,
      payment_url,
      expires_at,
    }, { onConflict: 'job_id' })
    .select()
    .single();

  if (error) throw error;
  return payment;
}

async function getPayment(paymentId, userId, role) {
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();

  if (error || !payment) throw Errors.NOT_FOUND('payment');

  if (role !== 'admin' && payment.customer_id !== userId && payment.worker_id !== userId) {
    throw Errors.FORBIDDEN();
  }

  return payment;
}

async function handleWebhook(rawBody, signature) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw Errors.VALIDATION_ERROR(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const { job_id, customer_id } = session.metadata;

    // Store the Payment Intent ID (not Session ID) so refunds work correctly
    const { data: payment } = await supabase
      .from('payments')
      .update({
        status:                 'completed',
        paid_at:                new Date().toISOString(),
        gateway_transaction_id: session.payment_intent,
      })
      .eq('job_id', job_id)
      .select()
      .single();

    if (payment) {
      broadcast('payment.confirmed', { job_id, payment_id: payment.id, status: 'completed' });
      await notificationsService.send(customer_id,   'payment_confirmed', 'Payment Confirmed', 'Your payment was successful.', { job_id });
      await notificationsService.send(payment.worker_id, 'payment_confirmed', 'Payment Received', 'Payment for your job has been received.', { job_id });
    }
  }
}

async function cashConfirm(paymentId, workerId) {
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).maybeSingle();

  if (!payment)                        throw Errors.NOT_FOUND('payment');
  if (payment.worker_id !== workerId)  throw Errors.FORBIDDEN();
  if (payment.method !== 'cash')       throw Errors.NOT_CASH_PAYMENT();

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('payments')
    .update({ status: 'completed', cash_confirmed_at: now, paid_at: now })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;

  broadcast('payment.confirmed', { job_id: payment.job_id, payment_id: paymentId, status: 'completed' });
  return { status: 'completed', confirmed_at: now };
}

async function refund(paymentId, adminId, { amount, reason }) {
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).maybeSingle();
  if (!payment) throw Errors.NOT_FOUND('payment');

  let gateway_refund_id = null;

  // gateway_transaction_id holds the Payment Intent ID after checkout.session.completed webhook fires
  if (payment.gateway_transaction_id && payment.method === 'card' && payment.status === 'completed') {
    const refundObj = await stripe.refunds.create({
      payment_intent: payment.gateway_transaction_id,
      amount:         Math.round(amount * 100),
    });
    gateway_refund_id = refundObj.id;
  }

  const { data: refund, error } = await supabase
    .from('refunds')
    .insert({ payment_id: paymentId, amount, reason, issued_by: adminId, gateway_refund_id, status: 'processing' })
    .select()
    .single();

  if (error) throw error;

  if (amount >= Number(payment.amount)) {
    await supabase.from('payments').update({ status: 'refunded' }).eq('id', paymentId);
  }

  return { refund_id: refund.id, amount, status: 'processing', estimated_return: '3-5 business days' };
}

module.exports = { initiatePayment, getPayment, handleWebhook, cashConfirm, refund };
