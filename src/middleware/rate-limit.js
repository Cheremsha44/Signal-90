import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, try again later' },
};

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // удачные входы не считаются
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
});

export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

export const verifyLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

export const resendLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) =>
    String(req.body?.email ?? '').toLowerCase() || ipKeyGenerator(req.ip),
});
