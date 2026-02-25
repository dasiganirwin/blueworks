const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate, validateQuery } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/admin.controller');

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

const workerListQuery = z.object({
  status: z.enum(['pending_approval', 'active', 'suspended']).optional(),
  page:   z.coerce.number().default(1),
  limit:  z.coerce.number().max(50).default(20),
});

const workerUpdateSchema = z.object({
  status: z.enum(['active', 'suspended']),
  note:   z.string().optional(),
});

const userUpdateSchema = z.object({
  status: z.enum(['active', 'suspended']),
  note:   z.string().optional(),
});

const analyticsQuery = z.object({
  from: z.string().datetime().optional(),
  to:   z.string().datetime().optional(),
});

const paymentsQuery = z.object({
  status: z.enum(['pending', 'completed', 'refunded']).optional(),
  page:   z.coerce.number().default(1),
  limit:  z.coerce.number().max(50).default(20),
});

router.get('/workers',       validateQuery(workerListQuery),  ctrl.listWorkers);
router.patch('/workers/:id', validate(workerUpdateSchema),    ctrl.updateWorker);
router.patch('/users/:id',   validate(userUpdateSchema),      ctrl.updateUser);
router.get('/analytics',     validateQuery(analyticsQuery),   ctrl.getAnalytics);
router.get('/payments',      validateQuery(paymentsQuery),    ctrl.listPayments);

module.exports = router;
