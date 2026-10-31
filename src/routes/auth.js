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

const router = Router();

router.post('/register', validate({ body: registerSchema }), registration);
router.post('/login', validate({ body: loginSchema }), login);
router.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  verifyEmail,
);
router.post('/resend-code', validate({ body: resendCodeSchema }), resendCode);
router.get('/me', auth, me);

export default router;
