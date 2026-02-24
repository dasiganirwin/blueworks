const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/disputes.controller');

const router = Router();

const createSchema = z.object({
  job_id:          z.string().uuid(),
  reason:          z.string().min(10).max(2000),
  evidence_photos: z.array(z.string().url()).optional(),
});

const resolveSchema = z.object({
  status:     z.literal('resolved'),
  resolution: z.string().min(5),
  action:     z.enum(['full_refund', 'partial_refund', 'no_action', 'worker_warning']),
});

router.post('/',     authenticate,                    validate(createSchema),  ctrl.createDispute);
router.get('/:id',   authenticate,                                             ctrl.getDispute);
router.patch('/:id', authenticate, requireRole('admin'), validate(resolveSchema), ctrl.resolveDispute);

module.exports = router;
