const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate, validateQuery } = require('../middleware/validate');
const multer = require('multer');
const z = require('zod');
const ctrl = require('../controllers/jobs.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

const createJobSchema = z.object({
  category:    z.string(),
  description: z.string().min(10).max(2000),
  location: z.object({
    address: z.string(),
    lat:     z.number().min(-90).max(90),
    lng:     z.number().min(-180).max(180),
  }),
  urgency:      z.enum(['immediate', 'scheduled']),
  scheduled_at: z.string().datetime().optional(),
}).refine(d => d.urgency !== 'scheduled' || d.scheduled_at, {
  message: 'scheduled_at is required when urgency is scheduled',
});

const statusSchema = z.object({
  status: z.enum(['accepted', 'en_route', 'in_progress', 'completed', 'cancelled']),
});

const listQuerySchema = z.object({
  status:   z.string().optional(),
  category: z.string().optional(),
  page:     z.coerce.number().default(1),
  limit:    z.coerce.number().max(50).default(20),
});

const nearbyQuerySchema = z.object({
  lat:    z.coerce.number(),
  lng:    z.coerce.number(),
  radius: z.coerce.number().default(10),
  page:   z.coerce.number().default(1),
  limit:  z.coerce.number().default(20),
});

// Routes — order matters: /nearby before /:id
router.get('/nearby',          authenticate, requireRole('worker'),   validateQuery(nearbyQuerySchema), ctrl.getNearbyJobs);
router.get('/',                authenticate,                          validateQuery(listQuerySchema),   ctrl.listJobs);
router.post('/',               authenticate, requireRole('customer'), validate(createJobSchema),        ctrl.createJob);
router.get('/:id',             authenticate,                          ctrl.getJob);
router.patch('/:id/status',    authenticate,                          validate(statusSchema),           ctrl.updateStatus);
router.post('/:id/photos',     authenticate, requireRole('customer'), upload.array('photos', 5),       ctrl.uploadPhotos);
router.delete('/:id',          authenticate, requireRole('admin'),                                      ctrl.deleteJob);

// Messages nested under jobs
router.get('/:id/messages',    authenticate, ctrl.getMessages);
router.post('/:id/messages',   authenticate, validate(z.object({ content: z.string().min(1).max(2000) })), ctrl.sendMessage);

module.exports = router;
