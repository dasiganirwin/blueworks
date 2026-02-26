// S5-07: Web Push subscription management routes
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const z = require('zod');
const pushSvc = require('../services/push.service');

const router = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth:   z.string(),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// Save a new push subscription for the authenticated user
router.post('/subscribe',   authenticate, validate(subscribeSchema),   async (req, res, next) => {
  try {
    await pushSvc.saveSubscription(req.user.sub, req.body);
    res.sendStatus(204);
  } catch (e) { next(e); }
});

// Remove a push subscription (user unsubscribed in browser)
router.post('/unsubscribe', authenticate, validate(unsubscribeSchema), async (req, res, next) => {
  try {
    await pushSvc.removeSubscription(req.user.sub, req.body.endpoint);
    res.sendStatus(204);
  } catch (e) { next(e); }
});

// Return the VAPID public key so the frontend can subscribe
router.get('/vapid-public-key', authenticate, (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

module.exports = router;
