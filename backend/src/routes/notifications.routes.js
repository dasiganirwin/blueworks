const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/notifications.controller');

const router = Router();

const listQuerySchema = z.object({
  read:  z.enum(['true', 'false']).optional(),
  page:  z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
});

router.get('/',              authenticate, validateQuery(listQuerySchema), ctrl.listNotifications);
router.patch('/read-all',    authenticate,                                  ctrl.markAllRead);
router.patch('/:id/read',    authenticate,                                  ctrl.markRead);

module.exports = router;
