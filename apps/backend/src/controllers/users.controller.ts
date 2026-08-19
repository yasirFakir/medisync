import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /api/users/me ────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await queryOne(
    `SELECT u.user_id AS id, u.full_name AS "fullName", u.email, u.role, u.phone_number AS "phoneNumber",
            u.avatar_url AS "avatarUrl", u.address, u.date_of_birth AS "dateOfBirth", u.gender,
            u.blood_group AS "bloodGroup", u.emergency_contact AS "emergencyContact", u.created_at AS "createdAt",
            dp.designation, dp.specialization AS specialty, dp.qualifications AS degrees,
            CONCAT(COALESCE(dp.area, ''), CASE WHEN dp.area IS NOT NULL AND dp.city IS NOT NULL THEN ', ' ELSE '' END, COALESCE(dp.city, '')) AS "clinicLocation",
            dp.area, dp.city, dp.experience_years AS "experienceYears", dp.consultation_fee AS "consultationFee", dp.bio,
            ph.store_name AS "storeName", ph.license_number AS "licenseNumber", ph.street_address AS "streetAddress", ph.city AS "pharmacyCity", ph.is_verified AS "isVerified"
     FROM users u
     LEFT JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
     LEFT JOIN pharmacies ph ON ph.pharmacy_id = u.user_id
     WHERE u.user_id = $1`,
    [req.user!.userId]
  );

  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, message: 'User profile retrieved', data: user, timestamp: new Date().toISOString() });
};

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    fullName,
    phoneNumber,
    avatarUrl,
    address,
    dateOfBirth,
    gender,
    bloodGroup,
    emergencyContact,
    // Doctor-specific fields
    designation,
    specialty,
    degrees,
    area,
    city,
    experienceYears,
    consultationFee,
    bio,
    // Pharmacy-specific fields
    storeName,
    streetAddress,
    pharmacyCity,
  } = req.body;

  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // 1. Update base User record
  await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone_number = COALESCE($2, phone_number),
         avatar_url = COALESCE($3, avatar_url),
         address = COALESCE($4, address),
         date_of_birth = COALESCE($5, date_of_birth),
         gender = COALESCE($6, gender),
         blood_group = COALESCE($7, blood_group),
         emergency_contact = COALESCE($8, emergency_contact),
         updated_at = NOW()
     WHERE user_id = $9`,
    [
      fullName ?? null,
      phoneNumber ?? null,
      avatarUrl ?? null,
      address ?? null,
      dateOfBirth ? new Date(dateOfBirth) : null,
      gender ?? null,
      bloodGroup ?? null,
      emergencyContact ?? null,
      userId,
    ]
  );

  // 2. Update role-specific profile tables if relevant
  if (userRole === 'DOCTOR') {
    const existingDoc = await queryOne('SELECT doctor_id FROM doctor_profiles WHERE doctor_id = $1', [userId]);
    if (existingDoc) {
      await query(
        `UPDATE doctor_profiles
         SET designation = COALESCE($1, designation),
             specialization = COALESCE($2, specialization),
             qualifications = COALESCE($3, qualifications),
             area = COALESCE($4, area),
             city = COALESCE($5, city),
             experience_years = COALESCE($6, experience_years),
             consultation_fee = COALESCE($7, consultation_fee),
             bio = COALESCE($8, bio),
             avatar_url = COALESCE($9, avatar_url),
             updated_at = NOW()
         WHERE doctor_id = $10`,
        [
          designation ?? null,
          specialty ?? null,
          degrees ?? null,
          area ?? null,
          city ?? null,
          experienceYears !== undefined ? Number(experienceYears) : null,
          consultationFee !== undefined ? Number(consultationFee) : null,
          bio ?? null,
          avatarUrl ?? null,
          userId,
        ]
      );
    }
  } else if (userRole === 'PHARMACY') {
    const existingPharm = await queryOne('SELECT pharmacy_id FROM pharmacies WHERE pharmacy_id = $1', [userId]);
    if (existingPharm) {
      await query(
        `UPDATE pharmacies
         SET store_name = COALESCE($1, store_name),
             street_address = COALESCE($2, street_address),
             city = COALESCE($3, city)
         WHERE pharmacy_id = $4`,
        [
          storeName ?? null,
          streetAddress ?? null,
          pharmacyCity ?? null,
          userId,
        ]
      );
    }
  }

  // 3. Fetch and return complete merged profile
  const updated = await queryOne(
    `SELECT u.user_id AS id, u.full_name AS "fullName", u.email, u.role, u.phone_number AS "phoneNumber",
            u.avatar_url AS "avatarUrl", u.address, u.date_of_birth AS "dateOfBirth", u.gender,
            u.blood_group AS "bloodGroup", u.emergency_contact AS "emergencyContact", u.created_at AS "createdAt",
            dp.designation, dp.specialization AS specialty, dp.qualifications AS degrees,
            CONCAT(COALESCE(dp.area, ''), CASE WHEN dp.area IS NOT NULL AND dp.city IS NOT NULL THEN ', ' ELSE '' END, COALESCE(dp.city, '')) AS "clinicLocation",
            dp.area, dp.city, dp.experience_years AS "experienceYears", dp.consultation_fee AS "consultationFee", dp.bio,
            ph.store_name AS "storeName", ph.license_number AS "licenseNumber", ph.street_address AS "streetAddress", ph.city AS "pharmacyCity", ph.is_verified AS "isVerified"
     FROM users u
     LEFT JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
     LEFT JOIN pharmacies ph ON ph.pharmacy_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );

  res.json({ success: true, message: 'Profile updated successfully', data: updated, timestamp: new Date().toISOString() });
};

// ─── POST /api/users/me/avatar ────────────────────────────────────────────────
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  // Generate Base64 Data URL for persistent storage without requiring external S3 bucket setup
  const base64Data = req.file.buffer.toString('base64');
  const avatarUrl = `data:${req.file.mimetype};base64,${base64Data}`;
  const userId = req.user!.userId;

  await query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2', [avatarUrl, userId]);

  if (req.user!.role === 'DOCTOR') {
    await query('UPDATE doctor_profiles SET avatar_url = $1, updated_at = NOW() WHERE doctor_id = $2', [avatarUrl, userId]);
  }

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: { avatarUrl },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/users  [ADMIN / DOCTOR] ─────────────────────────────────────────
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const roleFilter = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let queryStr = `
    SELECT 
      u.user_id AS id, 
      u.full_name AS "fullName", 
      u.email, 
      u.role, 
      u.phone_number AS "phoneNumber", 
      u.created_at AS "createdAt",
      (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = u.user_id) AS "totalAppointments",
      (SELECT diagnosis FROM ehr_records r WHERE r.patient_id = u.user_id ORDER BY r.session_date DESC LIMIT 1) AS "lastDiagnosis"
    FROM users u
  `;

  const whereClauses: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (roleFilter) {
    whereClauses.push(`u.role = $${paramIdx++}`);
    params.push(roleFilter);
  }

  if (search) {
    whereClauses.push(`(LOWER(u.full_name) LIKE $${paramIdx} OR LOWER(u.email) LIKE $${paramIdx} OR LOWER(COALESCE(u.phone_number, '')) LIKE $${paramIdx})`);
    params.push(`%${search.toLowerCase()}%`);
    paramIdx++;
  }

  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(' AND ');
  }

  queryStr += ` ORDER BY u.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const users = await query(queryStr, params);

  // Count total matching
  let countQuery = `SELECT COUNT(*) FROM users u`;
  if (whereClauses.length > 0) {
    countQuery += ` WHERE ` + whereClauses.join(' AND ');
  }
  const countParams = params.slice(0, paramIdx - 3);
  const [{ count }] = await query<{ count: string }>(countQuery, countParams);

  res.json({
    success: true,
    message: 'Users retrieved',
    data: users.map(u => ({
      ...u,
      totalAppointments: Number(u.totalAppointments || 0)
    })),
    pagination: { page, limit, total: parseInt(count || '0', 10), totalPages: Math.ceil(parseInt(count || '0', 10) / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── DELETE /api/users/:userId  [ADMIN] ────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  await query('DELETE FROM users WHERE user_id = $1', [userId]);
  res.json({ success: true, message: 'User deleted', timestamp: new Date().toISOString() });
};
