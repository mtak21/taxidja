import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import type { RegisterInput } from '../validators/auth.validator';

const BCRYPT_SALT_ROUNDS = 12;

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user: User): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'] });
}

function signRefreshToken(user: User): { token: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: user.id, jti }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
  const decoded = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(decoded.exp * 1000) };
}

async function issueTokenPair(user: User) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt } = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

// The auth responses (register/login/refresh/me) all return the same "safe
// user" shape, extended with the driver's verification status when the
// account is a DRIVER — the mobile app uses this to show the
// pending-verification state without a dedicated endpoint or real-time push;
// it's simply picked up on the next call that returns a user (e.g. /auth/me
// on the driver home screen mounting).
async function buildAuthUser(user: User) {
  const { passwordHash, ...safeUser } = user;

  if (user.role !== UserRole.DRIVER) {
    return { ...safeUser, driverVerificationStatus: null };
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });

  return { ...safeUser, driverVerificationStatus: driver?.verificationStatus ?? null };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])],
    },
  });

  if (existing) {
    throw new AuthError(409, 'Phone or email already in use');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        passwordHash,
        role: input.role === 'DRIVER' ? UserRole.DRIVER : UserRole.PASSENGER,
      },
    });

    if (input.role === 'DRIVER') {
      // verificationStatus defaults to PENDING (schema default) — a driver
      // can never receive rides straight out of registration, see
      // matching.service.ts and driver.service.ts#updateStatus for the
      // actual enforcement.
      await tx.driver.create({
        data: {
          userId: created.id,
          licenseNumber: input.licenseNumber,
          licenseExpiry: input.licenseExpiry,
          vehicles: {
            create: {
              type: input.vehicleType,
              plate: input.vehiclePlate,
              brand: input.vehicleBrand,
              model: input.vehicleModel,
              color: input.vehicleColor,
              isActive: true,
            },
          },
        },
      });
    }

    return created;
  });

  const tokens = await issueTokenPair(user);
  return { user: await buildAuthUser(user), ...tokens };
}

export async function login(input: { phone?: string; email?: string; password: string }) {
  const user = await prisma.user.findFirst({
    where: input.phone ? { phone: input.phone } : { email: input.email },
  });

  if (!user) {
    throw new AuthError(401, 'Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
    throw new AuthError(403, 'Account disabled');
  }

  const tokens = await issueTokenPair(user);
  return { user: await buildAuthUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let decoded: { sub: string; jti: string };
  try {
    decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as { sub: string; jti: string };
  } catch {
    throw new AuthError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError(401, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    throw new AuthError(401, 'Invalid or expired refresh token');
  }

  // Rotation: revoke the used refresh token and issue a new pair
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(user);
  return { user: await buildAuthUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthError(401, 'User not found');
  }
  return buildAuthUser(user);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
  } catch {
    throw new AuthError(401, 'Invalid or expired access token');
  }
}
