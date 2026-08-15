import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { logger } from '../config/logger';

export class AdminController {
  static async getDashboardStats(req: Request, res: Response) {
    try {
      // In a real app, we would verify req.user.role === 'ADMIN' here,
      // but assuming the auth middleware already handles this for protected routes,
      // or we can add specific admin middleware.
      const stats = await AdminService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
    }
  }

  static async listPharmacies(req: Request, res: Response) {
    try {
      const isVerifiedParam = req.query.isVerified;
      const isVerified = isVerifiedParam !== undefined && isVerifiedParam !== '' ? isVerifiedParam === 'true' : undefined;
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);

      const result = await AdminService.listPharmacies({ isVerified, search, page, limit });
      res.json({ success: true, data: result.pharmacies, pagination: result.pagination });
    } catch (error) {
      logger.error('Error listing pharmacies for admin:', error);
      res.status(500).json({ success: false, message: 'Failed to list pharmacies.' });
    }
  }

  static async verifyPharmacy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isVerified boolean is required.' });
      }

      const pharmacy = await AdminService.updatePharmacyVerification(id as string, isVerified);
      res.json({ success: true, message: `Pharmacy verification status updated to ${isVerified}`, data: pharmacy });
    } catch (error) {
      logger.error('Error updating pharmacy verification:', error);
      res.status(500).json({ success: false, message: 'Failed to update pharmacy verification status.' });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const role = req.query.role as string;
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);

      const result = await AdminService.listUsers({ role, search, page, limit });
      res.json({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      logger.error('Error listing users for admin:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ success: false, message: 'Role is required.' });
      }

      const user = await AdminService.updateUserRole(id as string, role);
      res.json({ success: true, message: `User role updated to ${role}`, data: user });
    } catch (error) {
      logger.error('Error updating user role:', error);
      res.status(500).json({ success: false, message: 'Failed to update user role.' });
    }
  }

  static async listTriageLogs(req: Request, res: Response) {
    try {
      const urgencyLevel = req.query.urgencyLevel as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);

      const result = await AdminService.listTriageLogs({ urgencyLevel, page, limit });
      res.json({ success: true, data: result.sessions, pagination: result.pagination });
    } catch (error) {
      logger.error('Error fetching triage logs for admin:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch triage logs.' });
    }
  }
}
