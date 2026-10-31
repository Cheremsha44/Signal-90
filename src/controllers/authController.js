import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

import crypto from 'node:crypto';

import { generateCode, hashCode } from '../lib/codegenerator.js';
import { sendVerificationCode } from '../lib/mailer.js';

const sign = (user) =>
  jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });

export const registration = async (req, res, next) => {
  try {
    const { email, username, password } = req.valid.body;

    const user = await prisma.user.create({
      data: { email, username, password: await bcrypt.hash(password, 10) },
      select: { id: true, email: true, username: true },
    });
    const code = generateCode();
    const codeHash = hashCode(code);
    await prisma.emailCode.create({
      data: {
        email: user.email,
        codeHash: codeHash,
        purpose: 'VERIFY_EMAIL',
        attempts: 0,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        usedAt: null,
      },
    });

    try {
      await sendVerificationCode(user.email, code);
    } catch (err) {
      console.error('mail failed', e);
    }

    res.status(201).json({ user, message: 'Verification code sent' });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return res
        .status(409)
        .json({ message: 'Email or username already taken' });
    }
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.valid.body;

    const emailCode = await prisma.emailCode.findFirst({
      where: {
        email,
        purpose: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!emailCode) {
      return res.status(404).json({ message: 'Code not found' });
    }

    if (emailCode.attempts >= 3) {
      return res.status(403).json({ message: 'Too many attempts' });
    }
    const a = Buffer.from(hashCode(code), 'hex');
    const b = Buffer.from(emailCode.codeHash, 'hex');
    const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!isValid) {
      await prisma.emailCode.update({
        where: { id: emailCode.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ message: 'Invalid code' });
    }

    await prisma.emailCode.update({
      where: { id: emailCode.id },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true, username: true },
    });

    res.status(200).json({ user, token: sign(user) });
  } catch (err) {
    next(err);
  }
};

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.valid.body;

    const user = await prisma.user.findUnique({ where: { email } });

    const hash = user ? user.password : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hash);

    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.emailVerifiedAt) {
      return res
        .status(403)
        .json({ code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' });
    }

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      token: sign(user),
    });
  } catch (err) {
    next(err);
  }
};

export const resendCode = async (req, res, next) => {
  try {
    const { email } = req.valid.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      return res
        .status(200)
        .json({ message: 'If the account exists, a code was sent' });
    }

    const last = await prisma.emailCode.findFirst({
      where: { email, purpose: 'VERIFY_EMAIL' },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < 60 * 1000) {
      return res.status(429).json({ message: 'Try again in a minute' });
    }

    const code = generateCode();
    const codeHash = hashCode(code);

    await prisma.$transaction([
      prisma.emailCode.updateMany({
        where: { email, purpose: 'VERIFY_EMAIL', usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.emailCode.create({
        data: {
          email,
          codeHash,
          purpose: 'VERIFY_EMAIL',
          expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        },
      }),
    ]);

    try {
      await sendVerificationCode(email, code);
    } catch (err) {
      console.error('mail failed', err);
    }

    res.status(200).json({ message: 'If the account exists, a code was sent' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, username: true },
    });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
