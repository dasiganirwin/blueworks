const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/users.controller');

const router = Router();

const updateSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
}).strict();

router.get('/',     authenticate, requireRole('admin'), ctrl.listUsers);
router.get('/me',   authenticate,                       ctrl.getMe);
router.patch('/me', authenticate, validate(updateSchema), ctrl.updateMe);
router.delete('/me',authenticate,                       ctrl.deleteMe);
router.get('/:id',  authenticate, requireRole('admin'), ctrl.getUserById);

module.exports = router;
