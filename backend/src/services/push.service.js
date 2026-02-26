// S5-07: Web Push notification service
const webpush = require('web-push');
const supabase = require('../config/supabase');

// VAPID keys must be generated once and set as env vars:
// npx web-push generate-vapid-keys
// Guard: skip initialization if keys are not configured (avoids crash on startup)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@bluework.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

/**
 * Store or update a push subscription for a user.
 */
async function saveSubscription(userId, subscription) {
  const { endpoint, keys } = subscription;
  await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, keys }, { onConflict: 'user_id,endpoint' });
}

/**
 * Remove a push subscription (user unsubscribed).
 */
async function removeSubscription(userId, endpoint) {
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
}

/**
 * Send a push notification to all subscriptions for a user.
 * Silently removes expired/invalid subscriptions (410 Gone).
 */
async function sendPush(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('user_id', userId);

  if (!subs?.length) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, message);
      } catch (err) {
        // 410 Gone = subscription expired; remove it
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        // Other errors: log and continue — never crash the notification flow
        console.error('[push.service] sendNotification error:', err.statusCode, sub.endpoint);
      }
    })
  );
}

module.exports = { saveSubscription, removeSubscription, sendPush };
