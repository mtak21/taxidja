import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as rideController from '../controllers/ride.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

// DRIVER is allowed here too: the driver app calls this to get the route
// (geometry + duration) to its next waypoint — pickup, then destination —
// during an active trip. It's a pure calculation with no side effects.
router.post('/estimate', requireRole(UserRole.PASSENGER, UserRole.DRIVER), rideController.estimateRide);
router.post('/', requireRole(UserRole.PASSENGER), rideController.createRide);
router.get('/history', rideController.getHistory);
// Must come before '/:id' — otherwise "active" would be parsed as a ride id.
router.get('/active', rideController.getActiveRide);
router.get('/:id', rideController.getRide);
router.patch('/:id/cancel', requireRole(UserRole.PASSENGER), rideController.cancelRide);
router.patch('/:id/cancel-by-driver', requireRole(UserRole.DRIVER), rideController.cancelRideByDriver);
router.patch('/:id/arriving', requireRole(UserRole.DRIVER), rideController.markArriving);
router.patch('/:id/start', requireRole(UserRole.DRIVER), rideController.startRide);
router.patch('/:id/complete', requireRole(UserRole.DRIVER), rideController.completeRide);
router.post('/:id/rating', requireRole(UserRole.PASSENGER), rideController.rateRide);

export default router;
