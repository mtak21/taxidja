import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.patch('/me', usersController.updateProfile);
router.patch('/me/password', usersController.changePassword);
router.post('/me/avatar', usersController.uploadAvatarMiddleware, usersController.uploadAvatar);

export default router;
