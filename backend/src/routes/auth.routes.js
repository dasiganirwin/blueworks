const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');
const z = require('zod');
const ctrl = require('../controllers/auth.controller');

const router = Router();

// S5-02: Per-route rate limiters (stricter than global 100/15min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Try again in 15 minutes.' } },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Try again in 1 hour.' } },
});

// Schemas
const registerSchema = z.object({
  role:     z.enum(['customer', 'worker']),
  name:     z.string().min(2).max(100),
  email:    z.string().email().optional(),
  phone:    z.string().min(10).max(20),
  password: z.string().min(8),
  skills:   z.array(z.string()).optional(),
});

const otpSendSchema    = z.object({ phone: z.string().min(10) });
const otpVerifySchema  = z.object({ phone: z.string(), otp: z.string().length(6) });
const loginSchema      = z.object({ identifier: z.string(), password: z.string() });
const refreshSchema    = z.object({ refresh_token: z.string() });
const forgotSchema     = z.object({ email: z.string().email() });
const resetSchema      = z.object({ token: z.string(), password: z.string().min(8) });

router.post('/register',         registerLimiter, validate(registerSchema),   ctrl.register);
router.post('/otp/send',         otpLimiter,      validate(otpSendSchema),    ctrl.sendOTP);
router.post('/otp/verify',                        validate(otpVerifySchema),   ctrl.verifyOTP);
router.post('/login',            loginLimiter,    validate(loginSchema),       ctrl.login);
router.post('/token/refresh',                     validate(refreshSchema),     ctrl.refreshToken);
router.post('/password/forgot',                   validate(forgotSchema),      ctrl.forgotPassword);
router.post('/password/reset',                    validate(resetSchema),       ctrl.resetPassword);
router.post('/logout',           authenticate,                                 ctrl.logout);
router.post('/logout-all',       authenticate,                                 ctrl.logoutAll);

module.exports = router;
