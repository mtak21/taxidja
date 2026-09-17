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
  return prisma.driver.upsert({
    where: { userId },
    create: {
      userId,
      onlineStatus: online,
    },
    update: {
      onlineStatus: online,
    },
  });
}
