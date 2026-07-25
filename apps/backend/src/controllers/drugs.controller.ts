import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';
import { getCache, setCache, deleteCache } from '../config/redis';
import { logger } from '../config/logger';

// ─── Shared select projection ─────────────────────────────────────────────────
const drugSelect = {
  drugId:               true,
  brandName:            true,
  saltComposition:      true,
  strength:             true,
  dosageForm:           true,
  manufacturer:         true,
  uses:                 true,
  sideEffects:          true,
  contraindications:    true,
  drugInteractions:     true,
  storageInstructions:  true,
  prescriptionRequired: true,
  estimatedPrice:       true,
  isGeneric:            true,
  trustRating:          true,
  createdAt:            true,
  updatedAt:            true,
} as const;

// ─── GET /api/drugs ───────────────────────────────────────────────────────────
export const listDrugs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page   = Math.max(1, parseInt(req.query.page  as string || '1',  10));
  const limit  = Math.min(100, parseInt(req.query.limit as string || '20', 10));
  const search = req.query.search as string | undefined;

  const where = search
    ? {
        OR: [
          { brandName:       { contains: search, mode: 'insensitive' as const } },
          { saltComposition: { contains: search, mode: 'insensitive' as const } },
          { manufacturer:    { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [drugs, total] = await Promise.all([
    prisma.drug.findMany({
      where,
      select: drugSelect,
      orderBy: { brandName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.drug.count({ where }),
  ]);

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
  const q    = (req.query.q as string || '').trim();
  const page  = Math.max(1, parseInt(req.query.page  as string || '1',  10));
  const limit = Math.min(50,  parseInt(req.query.limit as string || '20', 10));

  if (!q) throw new AppError('Search query (q) is required', 400);

  const cacheKey = `drug_search:${q.toLowerCase()}:${page}:${limit}`;
  const cached   = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, message: 'Search results (cached)', data: cached, timestamp: new Date().toISOString() });
    return;
  }

  const where = {
    OR: [
      { brandName:       { contains: q, mode: 'insensitive' as const } },
      { saltComposition: { contains: q, mode: 'insensitive' as const } },
      { manufacturer:    { contains: q, mode: 'insensitive' as const } },
      { uses:            { contains: q, mode: 'insensitive' as const } },
    ],
  };

  const [drugs, total] = await Promise.all([
    prisma.drug.findMany({
      where,
      select: drugSelect,
      orderBy: { brandName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.drug.count({ where }),
  ]);

  const result = { drugs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  await setCache(cacheKey, result, 300); // 5-min cache

  res.json({ success: true, message: 'Search results', data: result, timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs/:drugId ───────────────────────────────────────────────────
export const getDrugById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const drug = await prisma.drug.findUnique({ where: { drugId }, select: drugSelect });
  if (!drug) throw new AppError('Drug not found', 404);

  res.json({ success: true, message: 'Drug retrieved', data: drug, timestamp: new Date().toISOString() });
};

// ─── POST /api/drugs  [ADMIN only] ───────────────────────────────────────────
export const createDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    brandName, saltComposition, strength, dosageForm, manufacturer,
    uses, sideEffects, contraindications, drugInteractions, storageInstructions,
    prescriptionRequired, estimatedPrice, isGeneric, trustRating,
  } = req.body;

  // Duplicate check
  const existing = await prisma.drug.findFirst({
    where: {
      brandName:       { equals: brandName,       mode: 'insensitive' },
      saltComposition: { equals: saltComposition, mode: 'insensitive' },
      strength:        { equals: strength,        mode: 'insensitive' },
    },
  });
  if (existing) throw new AppError('A drug with this brand name, composition, and strength already exists', 409);

  const drug = await prisma.drug.create({
    data: {
      brandName, saltComposition, strength,
      dosageForm:           dosageForm           ?? null,
      manufacturer:         manufacturer         ?? null,
      uses:                 uses                 ?? null,
      sideEffects:          sideEffects          ?? null,
      contraindications:    contraindications    ?? null,
      drugInteractions:     drugInteractions     ?? null,
      storageInstructions:  storageInstructions  ?? null,
      prescriptionRequired: prescriptionRequired ?? false,
      estimatedPrice,
      isGeneric:            isGeneric            ?? false,
      trustRating:          trustRating          ?? 5.00,
    },
    select: drugSelect,
  });

  logger.info(`Drug created: ${drug.brandName} [${drug.drugId}]`);
  res.status(201).json({ success: true, message: 'Drug created', data: drug, timestamp: new Date().toISOString() });
};

// ─── PUT /api/drugs/:drugId  [ADMIN only] ────────────────────────────────────
export const updateDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const existing = await prisma.drug.findUnique({ where: { drugId } });
  if (!existing) throw new AppError('Drug not found', 404);

  const drug = await prisma.drug.update({
    where: { drugId },
    data: {
      ...req.body,
    },
    select: drugSelect,
  });

  // Bust any related caches
  await deleteCache(`drug_search:*`);

  logger.info(`Drug updated: ${drug.brandName} [${drug.drugId}]`);
  res.json({ success: true, message: 'Drug updated', data: drug, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/drugs/:drugId  [ADMIN only] ──────────────────────────────────
export const deleteDrug = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  const existing = await prisma.drug.findUnique({ where: { drugId } });
  if (!existing) throw new AppError('Drug not found', 404);

  await prisma.drug.delete({ where: { drugId } });

  logger.info(`Drug deleted: ${existing.brandName} [${drugId}]`);
  res.json({ success: true, message: 'Drug deleted', timestamp: new Date().toISOString() });
};

// ─── GET /api/drugs/substitutes?saltComposition= ─────────────────────────────
export const getSubstitutes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { saltComposition, budget } = req.query as { saltComposition: string; budget?: string };

  const cacheKey = `substitutes:${saltComposition.toLowerCase()}`;
  const cached   = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, message: 'Substitutes retrieved (cached)', data: cached, timestamp: new Date().toISOString() });
    return;
  }

  const drugs = await prisma.drug.findMany({
    where: { saltComposition: { contains: saltComposition, mode: 'insensitive' } },
    select: {
      drugId: true, brandName: true, saltComposition: true,
      strength: true, estimatedPrice: true, isGeneric: true, trustRating: true,
    },
    orderBy: { estimatedPrice: 'asc' },
  });

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
    .map((d: typeof drugs[number]): ScoredDrug => {
      const price  = Number(d.estimatedPrice);
      const rating = Number(d.trustRating);
      const pScore = Math.max(0, ((brandedPrice - price) / brandedPrice) * 100);
      const qScore = rating * 20;
      return {
        drugId:          d.drugId,
        brandName:       d.brandName,
        saltComposition: d.saltComposition,
        strength:        d.strength,
        price,
        isGeneric:       d.isGeneric,
        trustRating:     rating,
        score:           Math.round((0.6 * pScore + 0.4 * qScore) * 100) / 100,
      };
    })
    .sort((a: ScoredDrug, b: ScoredDrug) => b.score - a.score);

  const filtered = budget ? scored.filter((d: ScoredDrug) => d.price <= parseFloat(budget)) : scored;
  await setCache(cacheKey, filtered, 3600);

  res.json({ success: true, message: 'Substitutes retrieved', data: filtered, timestamp: new Date().toISOString() });
};
