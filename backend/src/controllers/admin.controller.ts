import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as adminService from '../services/admin.service';
import {
  listUsersQuerySchema,
  updateUserStatusSchema,
  listDriversQuerySchema,
  updateDriverVerificationSchema,
  createVehicleSchema,
  updateVehicleSchema,
  listVehiclesQuerySchema,
  listRidesQuerySchema,
  createCitySchema,
  updateCitySchema,
  createZoneSchema,
  updateZoneSchema,
  updatePricingSchema,
} from '../validators/admin.validator';
import { VehicleType } from '@prisma/client';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await adminService.getStats();
    return res.status(200).json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Users ------------------------------------------------------------

export async function listUsers(req: Request, res: Response) {
  try {
    const input = listUsersQuerySchema.parse(req.query);
    const result = await adminService.listUsers(input);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const input = updateUserStatusSchema.parse(req.body);
    const result = await adminService.updateUserStatus(req.params.id as string, input.isActive);
    if ('error' in result) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Drivers ------------------------------------------------------------

export async function listDrivers(req: Request, res: Response) {
  try {
    const input = listDriversQuerySchema.parse(req.query);
    const result = await adminService.listDrivers(input);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDriverVerification(req: Request, res: Response) {
  try {
    const input = updateDriverVerificationSchema.parse(req.body);
    const result = await adminService.updateDriverVerification(req.params.id as string, input.status);
    if ('error' in result) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Vehicles ------------------------------------------------------------

export async function listVehicles(req: Request, res: Response) {
  try {
    const input = listVehiclesQuerySchema.parse(req.query);
    const result = await adminService.listVehicles(input);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createVehicle(req: Request, res: Response) {
  try {
    const input = createVehicleSchema.parse(req.body);
    const result = await adminService.createVehicle(input);
    if ('error' in result) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateVehicle(req: Request, res: Response) {
  try {
    const input = updateVehicleSchema.parse(req.body);
    const result = await adminService.updateVehicle(req.params.id as string, input);
    if ('error' in result) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  try {
    const result = await adminService.deleteVehicle(req.params.id as string);
    if ('error' in result) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Rides ------------------------------------------------------------

export async function listRides(req: Request, res: Response) {
  try {
    const input = listRidesQuerySchema.parse(req.query);
    const result = await adminService.listRides(input);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRideDetail(req: Request, res: Response) {
  try {
    const result = await adminService.getRideDetail(req.params.id as string);
    if ('error' in result) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Cities ------------------------------------------------------------

export async function listCities(_req: Request, res: Response) {
  try {
    const cities = await adminService.listCities();
    return res.status(200).json({ cities });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCity(req: Request, res: Response) {
  try {
    const input = createCitySchema.parse(req.body);
    const city = await adminService.createCity(input.name);
    return res.status(201).json({ city });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCity(req: Request, res: Response) {
  try {
    const input = updateCitySchema.parse(req.body);
    const result = await adminService.updateCity(req.params.id as string, input);
    if ('error' in result) {
      return res.status(404).json({ error: 'City not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Zones ------------------------------------------------------------

export async function listZones(req: Request, res: Response) {
  try {
    const cityId = typeof req.query.cityId === 'string' ? req.query.cityId : undefined;
    const zones = await adminService.listZones(cityId);
    return res.status(200).json({ zones });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createZone(req: Request, res: Response) {
  try {
    const input = createZoneSchema.parse(req.body);
    const result = await adminService.createZone(input);
    if ('error' in result) {
      return res.status(404).json({ error: 'City not found' });
    }
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateZone(req: Request, res: Response) {
  try {
    const input = updateZoneSchema.parse(req.body);
    const result = await adminService.updateZone(req.params.id as string, input);
    if ('error' in result) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

// --- Pricing ------------------------------------------------------------

export async function listPricing(_req: Request, res: Response) {
  try {
    const pricing = await adminService.listPricing();
    return res.status(200).json({ pricing });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updatePricing(req: Request, res: Response) {
  try {
    const input = updatePricingSchema.parse(req.body);
    const vehicleType = req.params.vehicleType as VehicleType;
    if (!Object.values(VehicleType).includes(vehicleType)) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }
    const pricing = await adminService.updatePricing(vehicleType, input);
    return res.status(200).json({ pricing });
  } catch (error) {
    return handleError(res, error);
  }
}
