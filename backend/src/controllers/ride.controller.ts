import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { UserRole } from '@prisma/client';
import { estimateRideSchema, createRideSchema } from '../validators/ride.validator';
import { prisma } from '../config/prisma';
import * as rideService from '../services/ride.service';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function estimateRide(req: Request, res: Response) {
  try {
    const input = estimateRideSchema.parse(req.body);
    const estimate = await rideService.estimate(input.pickup, input.destination, input.vehicleType);
    return res.status(200).json({ estimate });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createRide(req: Request, res: Response) {
  try {
    const input = createRideSchema.parse(req.body);
    const ride = await rideService.createRide({
      passengerId: req.user!.id,
      pickup: input.pickup,
      destination: input.destination,
      vehicleType: input.vehicleType,
      pickupAddress: input.pickupAddress,
      destinationAddress: input.destinationAddress,
    });
    return res.status(201).json({ ride });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRide(req: Request, res: Response) {
  try {
    const ride = await rideService.getRideById(req.params.id as string);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const user = req.user!;
    const isOwner = ride.passengerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    let isAssignedDriver = false;

    if (!isOwner && !isAdmin && user.role === UserRole.DRIVER && ride.driverId) {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      isAssignedDriver = driver?.id === ride.driverId;
    }

    if (!isOwner && !isAdmin && !isAssignedDriver) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return res.status(200).json({ ride });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelRide(req: Request, res: Response) {
  try {
    const result = await rideService.cancelRide(req.params.id as string, req.user!.id);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Ride not found' });
    }
    if (result.error === 'not_cancellable') {
      return res.status(409).json({ error: 'Ride can no longer be cancelled' });
    }

    return res.status(200).json({ ride: result.ride });
  } catch (error) {
    return handleError(res, error);
  }
}
