import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes with authentication and check for ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/stats', AdminController.getDashboardStats);
router.get('/pharmacies', AdminController.listPharmacies);
router.patch('/pharmacies/:id/verify', AdminController.verifyPharmacy);
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.get('/triage-logs', AdminController.listTriageLogs);

export default router;
