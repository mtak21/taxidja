import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware, requireRole(UserRole.ADMIN));

router.get('/stats', adminController.getStats);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

router.get('/drivers', adminController.listDrivers);
router.patch('/drivers/:id/verification', adminController.updateDriverVerification);

router.get('/vehicles', adminController.listVehicles);
router.post('/vehicles', adminController.createVehicle);
router.patch('/vehicles/:id', adminController.updateVehicle);
router.delete('/vehicles/:id', adminController.deleteVehicle);

router.get('/rides', adminController.listRides);
router.get('/rides/:id', adminController.getRideDetail);

router.get('/cities', adminController.listCities);
router.post('/cities', adminController.createCity);
router.patch('/cities/:id', adminController.updateCity);

router.get('/zones', adminController.listZones);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);

router.get('/pricing', adminController.listPricing);
router.patch('/pricing/:vehicleType', adminController.updatePricing);

export default router;
