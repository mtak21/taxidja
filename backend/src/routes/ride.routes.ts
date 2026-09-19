import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as rideController from '../controllers/ride.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/estimate', requireRole(UserRole.PASSENGER), rideController.estimateRide);
router.post('/', requireRole(UserRole.PASSENGER), rideController.createRide);
router.get('/:id', rideController.getRide);
router.patch('/:id/cancel', requireRole(UserRole.PASSENGER), rideController.cancelRide);
router.patch('/:id/arriving', requireRole(UserRole.DRIVER), rideController.markArriving);
router.patch('/:id/start', requireRole(UserRole.DRIVER), rideController.startRide);
router.patch('/:id/complete', requireRole(UserRole.DRIVER), rideController.completeRide);

export default router;
