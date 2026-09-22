import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? '.jpg';
    cb(null, `${req.user!.id}-${crypto.randomUUID()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: AVATAR_MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in ALLOWED_MIME_TYPES)) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

export function avatarPublicPath(filename: string): string {
  return `/uploads/avatars/${filename}`;
}
