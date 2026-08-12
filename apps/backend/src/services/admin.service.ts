import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
  /**
   * Get high-level KPI stats for the admin dashboard
   */
  static async getDashboardStats() {
    const totalUsers = await prisma.user.count();
    const totalPharmacies = await prisma.pharmacy.count();
    const unverifiedPharmacies = await prisma.pharmacy.count({
      where: { isVerified: false },
    });
    const totalDrugs = await prisma.drug.count();

    return {
      totalUsers,
      totalPharmacies,
      unverifiedPharmacies,
      totalDrugs,
    };
  }

  /**
   * Get list of pharmacies with optional filtering for admin review
   */
  static async listPharmacies(params: { isVerified?: boolean; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof params.isVerified === 'boolean') {
      where.isVerified = params.isVerified;
    }
    if (params.search) {
      where.OR = [
        { storeName: { contains: params.search, mode: 'insensitive' } },
        { licenseNumber: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [pharmacies, total] = await Promise.all([
      prisma.pharmacy.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pharmacy.count({ where }),
    ]);

    return {
      pharmacies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update pharmacy verification status (approve or revoke)
   */
  static async updatePharmacyVerification(pharmacyId: string, isVerified: boolean) {
    const updated = await prisma.pharmacy.update({
      where: { pharmacyId },
      data: { isVerified },
    });
    return updated;
  }

  /**
   * List all platform users with filtering by role and search query
   */
  static async listUsers(params: { role?: any; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) {
      where.role = params.role;
    }
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phoneNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          userId: true,
          fullName: true,
          email: true,
          role: true,
          phoneNumber: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(u => ({ ...u, id: u.userId })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user security role (e.g. promote to ADMIN, change to DOCTOR)
   */
  static async updateUserRole(userId: string, role: any) {
    const updated = await prisma.user.update({
      where: { userId },
      data: { role },
      select: {
        userId: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return { ...updated, id: updated.userId };
  }

  /**
   * List AI Triage session logs for admin safety oversight
   */
  static async listTriageLogs(params: { page?: number; limit?: number; urgencyLevel?: any }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.urgencyLevel && params.urgencyLevel !== 'ALL') {
      where.urgencyLevel = params.urgencyLevel;
    }

    const [sessions, total] = await Promise.all([
      prisma.triageSession.findMany({
        where,
        include: {
          patient: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.triageSession.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
