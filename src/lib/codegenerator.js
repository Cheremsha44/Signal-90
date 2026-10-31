import crypto from 'node:crypto';

export const generateCode = () =>
  String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

export const hashCode = (code) =>
  crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(code)
    .digest('hex');
