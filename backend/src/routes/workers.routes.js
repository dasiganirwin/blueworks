const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate, validateQuery } = require('../middleware/validate');
const z = require('zod');
const ctrl = require('../controllers/workers.controller');

const router = Router();

const nearbySchema = z.object({
  lat:      z.coerce.number().min(-90).max(90),
  lng:      z.coerce.number().min(-180).max(180),
  category: z.string(),
  radius:   z.coerce.number().min(1).max(100).default(10),
});

const availabilitySchema = z.object({
  status: z.enum(['online', 'offline', 'busy']),
});

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const VALID_CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

const profileSchema = z.object({
  name:   z.string().min(2).max(100).optional(),
  skills: z.array(z.enum(VALID_CATEGORIES)).min(1).optional(),
}).refine(d => d.name || d.skills, { message: 'At least one field (name or skills) is required.' });

// /me routes must come before /:id
router.get('/nearby',            authenticate, requireRole('customer'), validateQuery(nearbySchema),  ctrl.getNearby);
router.get('/me',                authenticate, requireRole('worker'),                                 ctrl.getMe);
router.get('/me/earnings',       authenticate, requireRole('worker'),                                 ctrl.getEarnings);
router.patch('/me',              authenticate, requireRole('worker'),   validate(profileSchema),      ctrl.updateProfile);
router.patch('/me/availability', authenticate, requireRole('worker'),   validate(availabilitySchema), ctrl.updateAvailability);
router.patch('/me/location',     authenticate, requireRole('worker'),   validate(locationSchema),     ctrl.updateLocation);
router.get('/:id',               authenticate,                                                        ctrl.getWorkerById);

module.exports = router;
