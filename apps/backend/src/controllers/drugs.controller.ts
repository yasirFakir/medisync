import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { getCache, setCache } from '../config/redis';

// ─── GET /api/drugs/substitutes ──────────────────────────────────────────────
export const getSubstitutes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { saltComposition, budget } = req.query as { saltComposition: string; budget?: string };

  const cacheKey = `substitutes:${saltComposition}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, message: 'Substitutes retrieved (cached)', data: cached, timestamp: new Date().toISOString() });
    return;
  }

  const drugs = await query<{
    drug_id: string;
    brand_name: string;
    salt_composition: string;
    strength: string;
    estimated_price: number;
    is_generic: boolean;
    trust_rating: number;
  }>(
    `SELECT drug_id, brand_name, salt_composition, strength, estimated_price, is_generic, trust_rating
     FROM master_pharmacy
     WHERE LOWER(salt_composition) LIKE LOWER($1)
     ORDER BY estimated_price ASC`,
    [`%${saltComposition}%`]
  );

  if (!drugs.length) throw new AppError('No drugs found for the given salt composition', 404);

  // Generic Matching Score: (0.60 × Pscore) + (0.40 × Qscore)
  const brandedPrice = drugs[0].estimated_price;
  const scored = drugs.map((drug) => {
    const pScore = Math.max(0, ((brandedPrice - drug.estimated_price) / brandedPrice) * 100);
    const qScore = drug.trust_rating * 20;
    const score = 0.6 * pScore + 0.4 * qScore;
    return {
      drugId: drug.drug_id,
      brandName: drug.brand_name,
      saltComposition: drug.salt_composition,
      strength: drug.strength,
      price: drug.estimated_price,
      isGeneric: drug.is_generic,
      trustRating: drug.trust_rating,
      score: Math.round(score * 100) / 100,
    };
  }).sort((a, b) => b.score - a.score);

  const filtered = budget ? scored.filter((d) => d.price <= parseFloat(budget)) : scored;

  await setCache(cacheKey, filtered, 3600);

  res.json({ success: true, message: 'Substitutes retrieved', data: filtered, timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs ───────────────────────────────────────────────────────────
export const listDrugs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const drugs = await query(
    `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
            strength, estimated_price AS "estimatedPrice", is_generic AS "isGeneric", trust_rating AS "trustRating"
     FROM master_pharmacy
     WHERE ($1::text IS NULL OR LOWER(brand_name) LIKE LOWER($1) OR LOWER(salt_composition) LIKE LOWER($1))
     ORDER BY brand_name ASC LIMIT $2 OFFSET $3`,
    [search ? `%${search}%` : null, limit, offset]
  );

  res.json({ success: true, message: 'Drugs retrieved', data: drugs, timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs/:drugId ───────────────────────────────────────────────────
export const getDrugById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;
  const drug = await queryOne(
    `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
            strength, estimated_price AS "estimatedPrice", is_generic AS "isGeneric", trust_rating AS "trustRating"
     FROM master_pharmacy WHERE drug_id = $1`,
    [drugId]
  );
  if (!drug) throw new AppError('Drug not found', 404);
  res.json({ success: true, message: 'Drug retrieved', data: drug, timestamp: new Date().toISOString() });
};
