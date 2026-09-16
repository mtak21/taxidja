import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { AuthError } from '../services/auth.service';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function register(req: Request, res: Response) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const input = refreshSchema.parse(req.body);
    const result = await authService.refresh(input.refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const input = refreshSchema.parse(req.body);
    await authService.logout(input.refreshToken);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getUserById(req.user!.id);
    return res.status(200).json({ user });
  } catch (error) {
    return handleError(res, error);
  }
}
