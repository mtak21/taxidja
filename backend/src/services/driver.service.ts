import { DriverVerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function updateLocation(userId: string, latitude: number, longitude: number) {
  return prisma.driver.upsert({
    where: { userId },
    create: {
      userId,
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
    update: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
  });
}

export async function updateStatus(userId: string, online: boolean) {
  if (online) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver || driver.verificationStatus !== DriverVerificationStatus.VERIFIED) {
      return { error: 'not_verified' as const };
    }
  }

  const driver = await prisma.driver.upsert({
    where: { userId },
    create: {
      userId,
      onlineStatus: online,
    },
    update: {
      onlineStatus: online,
    },
  });

  return { driver };
}
