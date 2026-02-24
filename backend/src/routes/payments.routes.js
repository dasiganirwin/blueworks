const { Router } = require('express');
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/payments.controller');

const router = Router();

const initiateSchema = z.object({
  job_id:   z.string().uuid(),
  method:   z.enum(['card', 'cash']),
  amount:   z.number().positive(),
  currency: z.string().length(3).default('PHP'),
});

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(5),
});

// Stripe webhook needs raw body — mount before json middleware
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  ctrl.handleWebhook
);

router.post('/',               authenticate, requireRole('customer'),        validate(initiateSchema), ctrl.initiatePayment);
router.get('/:id',             authenticate,                                  ctrl.getPayment);
router.post('/:id/cash-confirm', authenticate, requireRole('worker'),         ctrl.cashConfirm);
router.post('/:id/refund',     authenticate, requireRole('admin'),            validate(refundSchema),   ctrl.refund);

module.exports = router;
