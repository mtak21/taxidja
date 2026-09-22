import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import type { UpdateProfileInput } from '../validators/users.validator';

const BCRYPT_SALT_ROUNDS = 12;

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email, id: { not: userId } },
    });
    if (existing) {
      return { error: 'email_in_use' as const };
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  return { user: sanitizeUser(user) };
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: 'not_found' as const };
  }

  const matches = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!matches) {
    return { error: 'invalid_old_password' as const };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true as const };
}

export async function setAvatar(userId: string, avatarUrl: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
  return sanitizeUser(user);
}
