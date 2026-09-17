import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as driverController from '../controllers/driver.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware, requireRole(UserRole.DRIVER));

router.patch('/location', driverController.updateLocation);
router.patch('/status', driverController.updateStatus);

export default router;
