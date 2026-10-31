import { Router } from 'express';
import { validate } from '../middleware/validate.js';

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
} from '../schemas/auth.js';
import {
  registration,
  verifyEmail,
  login,
  me,
  resendCode,
} from '../controllers/authController.js';

import { auth } from '../middleware/auth.js';
import {
  authLimiter,
  loginLimiter,
  registerLimiter,
  verifyLimiter,
  resendLimiter,
} from '../middleware/rate-limit.js';

const router = Router();

router.use(authLimiter);

router.post(
  '/register',
  registerLimiter,
  validate({ body: registerSchema }),
  registration,
);
router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.post(
  '/verify-email',
  verifyLimiter,
  validate({ body: verifyEmailSchema }),
  verifyEmail,
);
router.post(
  '/resend-code',
  resendLimiter,
  validate({ body: resendCodeSchema }),
  resendCode,
);
router.get('/me', auth, me);

export default router;
