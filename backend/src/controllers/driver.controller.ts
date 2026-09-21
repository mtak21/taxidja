import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { updateLocationSchema, updateStatusSchema } from '../validators/driver.validator';
import * as driverService from '../services/driver.service';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function updateLocation(req: Request, res: Response) {
  try {
    const input = updateLocationSchema.parse(req.body);
    const driver = await driverService.updateLocation(req.user!.id, input.latitude, input.longitude);
    return res.status(200).json({ driver });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const input = updateStatusSchema.parse(req.body);
    const result = await driverService.updateStatus(req.user!.id, input.online);
    if ('error' in result) {
      return res.status(403).json({ error: 'Driver is not verified yet' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
