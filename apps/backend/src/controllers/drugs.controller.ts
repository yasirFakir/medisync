import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { getCache, setCache, deleteCache } from '../config/redis';
import { logger } from '../config/logger';

// ─── Shared Column Selection SQL ──────────────────────────────────────────────
const DRUG_FIELDS = `
  drug_id AS "drugId",
  brand_name AS "brandName",
  salt_composition AS "saltComposition",
  strength,
  dosage_form AS "dosageForm",
  manufacturer,
  uses,
  side_effects AS "sideEffects",
  contraindications,
  drug_interactions AS "drugInteractions",
  storage_instructions AS "storageInstructions",
  prescription_required AS "prescriptionRequired",
  estimated_price AS "estimatedPrice",
  is_generic AS "isGeneric",
  trust_rating AS "trustRating",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

// ─── GET /api/drugs ───────────────────────────────────────────────────────────
export const listDrugs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit as string || '20', 10));
  const offset = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const searchPattern = search ? `%${search}%` : null;

  const drugs = await query(
    `SELECT ${DRUG_FIELDS}
     FROM master_pharmacy
     WHERE ($1::text IS NULL OR LOWER(brand_name) LIKE LOWER($1) OR LOWER(salt_composition) LIKE LOWER($1) OR LOWER(manufacturer) LIKE LOWER($1))
     ORDER BY brand_name ASC LIMIT $2 OFFSET $3`,
    [searchPattern, limit, offset]
  );

  const [countResult] = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM master_pharmacy
     WHERE ($1::text IS NULL OR LOWER(brand_name) LIKE LOWER($1) OR LOWER(salt_composition) LIKE LOWER($1) OR LOWER(manufacturer) LIKE LOWER($1))`,
    [searchPattern]
  );
  const total = parseInt(countResult?.count || '0', 10);

  res.json({
    success: true,
    message: 'Drugs retrieved',
    data: drugs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/drugs/search?q= ─────────────────────────────────────────────────
export const searchDrugs = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = (req.query.q as string || '').trim();
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string || '20', 10));
  const offset = (page - 1) * limit;

  if (!q) throw new AppError('Search query (q) is required', 400);

  const cacheKey = `drug_search:${q.toLowerCase()}:${page}:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, message: 'Search results (cached)', data: cached, timestamp: new Date().toISOString() });
    return;
  }

  const searchPattern = `%${q}%`;
  const drugs = await query(
    `SELECT ${DRUG_FIELDS}
     FROM master_pharmacy
     WHERE LOWER(brand_name) LIKE LOWER($1)
        OR LOWER(salt_composition) LIKE LOWER($1)
        OR LOWER(manufacturer) LIKE LOWER($1)
        OR LOWER(uses) LIKE LOWER($1)
     ORDER BY brand_name ASC LIMIT $2 OFFSET $3`,
    [searchPattern, limit, offset]
  );

  const [countResult] = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM master_pharmacy
     WHERE LOWER(brand_name) LIKE LOWER($1)
        OR LOWER(salt_composition) LIKE LOWER($1)
        OR LOWER(manufacturer) LIKE LOWER($1)
        OR LOWER(uses) LIKE LOWER($1)`,
    [searchPattern]
  );
  const total = parseInt(countResult?.count || '0', 10);

  const result = { drugs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  await setCache(cacheKey, result, 300);

  res.json({ success: true, message: 'Search results', data: result, timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs/:drugId ───────────────────────────────────────────────────
export const getDrugById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const drug = await queryOne(
    `SELECT ${DRUG_FIELDS} FROM master_pharmacy WHERE drug_id = $1`,
    [drugId]
  );
  if (!drug) throw new AppError('Drug not found', 404);

  res.json({ success: true, message: 'Drug retrieved', data: drug, timestamp: new Date().toISOString() });
};

// ─── POST /api/drugs [ADMIN only] ─────────────────────────────────────────────
export const createDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    brandName, saltComposition, strength, dosageForm, manufacturer,
    uses, sideEffects, contraindications, drugInteractions, storageInstructions,
    prescriptionRequired, estimatedPrice, isGeneric, trustRating,
  } = req.body;

  const existing = await queryOne(
    `SELECT drug_id FROM master_pharmacy
     WHERE LOWER(brand_name) = LOWER($1) AND LOWER(salt_composition) = LOWER($2) AND LOWER(strength) = LOWER($3)`,
    [brandName, saltComposition, strength]
  );
  if (existing) throw new AppError('A drug with this brand name, composition, and strength already exists', 409);

  const [drug] = await query(
    `INSERT INTO master_pharmacy (
      brand_name, salt_composition, strength, dosage_form, manufacturer,
      uses, side_effects, contraindications, drug_interactions, storage_instructions,
      prescription_required, estimated_price, is_generic, trust_rating
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING ${DRUG_FIELDS}`,
    [
      brandName, saltComposition, strength, dosageForm || null, manufacturer || null,
      uses || null, sideEffects || null, contraindications || null, drugInteractions || null, storageInstructions || null,
      prescriptionRequired ?? false, estimatedPrice, isGeneric ?? false, trustRating ?? 5.00,
    ]
  );

  logger.info(`Drug created: ${brandName}`);
  res.status(201).json({ success: true, message: 'Drug created', data: drug, timestamp: new Date().toISOString() });
};

// ─── PUT /api/drugs/:drugId [ADMIN only] ──────────────────────────────────────
export const updateDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const existing = await queryOne(`SELECT drug_id FROM master_pharmacy WHERE drug_id = $1`, [drugId]);
  if (!existing) throw new AppError('Drug not found', 404);

  const fields = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  const fieldMap: Record<string, string> = {
    brandName: 'brand_name',
    saltComposition: 'salt_composition',
    strength: 'strength',
    dosageForm: 'dosage_form',
    manufacturer: 'manufacturer',
    uses: 'uses',
    sideEffects: 'side_effects',
    contraindications: 'contraindications',
    drugInteractions: 'drug_interactions',
    storageInstructions: 'storage_instructions',
    prescriptionRequired: 'prescription_required',
    estimatedPrice: 'estimated_price',
    isGeneric: 'is_generic',
    trustRating: 'trust_rating',
  };

  for (const [key, columnName] of Object.entries(fieldMap)) {
    if (fields[key] !== undefined) {
      updates.push(`${columnName} = $${paramIdx++}`);
      values.push(fields[key]);
    }
  }

  if (!updates.length) throw new AppError('No fields provided for update', 400);

  values.push(drugId);
  const [updated] = await query(
    `UPDATE master_pharmacy SET ${updates.join(', ')} WHERE drug_id = $${paramIdx} RETURNING ${DRUG_FIELDS}`,
    values
  );

  await deleteCache(`drug_search:*`);
  logger.info(`Drug updated: ${drugId}`);
  res.json({ success: true, message: 'Drug updated', data: updated, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/drugs/:drugId [ADMIN only] ───────────────────────────────────
export const deleteDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const existing = await queryOne(`SELECT brand_name FROM master_pharmacy WHERE drug_id = $1`, [drugId]);
  if (!existing) throw new AppError('Drug not found', 404);

  await query(`DELETE FROM master_pharmacy WHERE drug_id = $1`, [drugId]);

  logger.info(`Drug deleted: ${drugId}`);
  res.json({ success: true, message: 'Drug deleted', timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs/substitutes?saltComposition= ─────────────────────────────
export const getSubstitutes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { saltComposition, budget } = req.query as { saltComposition: string; budget?: string };

  const cacheKey = `substitutes:${saltComposition.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, message: 'Substitutes retrieved (cached)', data: cached, timestamp: new Date().toISOString() });
    return;
  }

  const drugs = await query<{
    drugId: string;
    brandName: string;
    saltComposition: string;
    strength: string;
    estimatedPrice: number;
    isGeneric: boolean;
    trustRating: number;
  }>(
    `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
            strength, estimated_price AS "estimatedPrice", is_generic AS "isGeneric", trust_rating AS "trustRating"
     FROM master_pharmacy
     WHERE LOWER(salt_composition) LIKE LOWER($1)
     ORDER BY estimated_price ASC`,
    [`%${saltComposition}%`]
  );

  if (!drugs.length) throw new AppError('No drugs found for the given salt composition', 404);

  const brandedPrice = Number(drugs[0].estimatedPrice);
  interface ScoredDrug {
    drugId: string;
    brandName: string;
    saltComposition: string;
    strength: string;
    price: number;
    isGeneric: boolean;
    trustRating: number;
    score: number;
  }

  const scored: ScoredDrug[] = drugs
    .map((d): ScoredDrug => {
      const price = Number(d.estimatedPrice);
      const rating = Number(d.trustRating);
      const pScore = Math.max(0, ((brandedPrice - price) / brandedPrice) * 100);
      const qScore = rating * 20;
      return {
        drugId: d.drugId,
        brandName: d.brandName,
        saltComposition: d.saltComposition,
        strength: d.strength,
        price,
        isGeneric: d.isGeneric,
        trustRating: rating,
        score: Math.round((0.6 * pScore + 0.4 * qScore) * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);

  const filtered = budget ? scored.filter((d) => d.price <= parseFloat(budget)) : scored;
  await setCache(cacheKey, filtered, 3600);

  res.json({ success: true, message: 'Substitutes retrieved', data: filtered, timestamp: new Date().toISOString() });
};
