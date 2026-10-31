import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  email,
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, digits and underscore'),
  password: z.string().min(8).max(72),
});

// логин строим из регистрации: берём только email и password
export const loginSchema = registerSchema.pick({ email: true, password: true });

export const resendCodeSchema = z.object({
  email,
});

export const verifyEmailSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});
