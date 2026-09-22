import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { updateProfileSchema, changePasswordSchema } from '../validators/users.validator';
import * as usersService from '../services/users.service';
import { avatarUpload, avatarPublicPath } from '../config/upload';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const result = await usersService.updateProfile(req.user!.id, input);
    if ('error' in result) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const input = changePasswordSchema.parse(req.body);
    const result = await usersService.changePassword(req.user!.id, input.oldPassword, input.newPassword);
    if ('error' in result) {
      if (result.error === 'not_found') {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

// multer's own middleware calls next(err) on failure, which would otherwise
// hit Express's default (HTML) error page — this wrapper keeps every
// response on this route JSON, consistent with the rest of the API.
export function uploadAvatarMiddleware(req: Request, res: Response, next: NextFunction) {
  avatarUpload.single('avatar')(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5 MB)' });
    }
    if (error instanceof Error && error.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ error: 'Only JPG and PNG images are allowed' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Upload failed' });
  });
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const user = await usersService.setAvatar(req.user!.id, avatarPublicPath(req.file.filename));
    return res.status(200).json({ user });
  } catch (error) {
    return handleError(res, error);
  }
}
