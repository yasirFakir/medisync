import { query } from '../config/database';
import { logger } from '../config/logger';
import { getCache, setCache } from '../config/redis';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Raw drug row returned from master_pharmacy queries */
interface DrugRow {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  dosageForm: string | null;
  manufacturer: string | null;
  estimatedPrice: number;
  isGeneric: boolean;
  trustRating: number;
  uses: string | null;
  sideEffects: string | null;
  contraindications: string | null;
  prescriptionRequired: boolean;
}

/** A scored alternative with match details */
export interface ScoredAlternative {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  dosageForm: string | null;
  manufacturer: string | null;
  estimatedPrice: number;
  isGeneric: boolean;
  trustRating: number;
  score: number;
  matchDetails: {
    sameActiveIngredient: boolean;
    sameStrength: boolean;
    sameDosageForm: boolean;
    priceDifference: number;       // negative = cheaper
    priceDifferencePercent: number; // negative = cheaper
  };
}

/** Comparison data for two or more drugs */
export interface DrugComparison {
  drugId: string;
  brandName: string;
  genericName: string;
  manufacturer: string | null;
  strength: string;
  dosageForm: string | null;
  estimatedPrice: number;
  isGeneric: boolean;
  trustRating: number;
  uses: string | null;
  sideEffects: string | null;
  contraindications: string | null;
  prescriptionRequired: boolean;
}

// ─── Configurable Ranking Weights ─────────────────────────────────────────────

/**
 * Ranking weights are configurable. Each weight controls how much a factor
 * contributes to the final score (0-100 scale).
 *
 * Decision Policy: Alternative ranking is DETERMINISTIC.
 * AI is never used to rank or determine alternatives.
 */
const RANKING_WEIGHTS = {
  sameStrength:    20,  // Bonus for exact strength match
  sameDosageForm:  10,  // Bonus for same dosage form (tablet, capsule, etc.)
  priceSavings:    35,  // Weight for price savings relative to source drug
  trustRating:     25,  // Weight for trust/quality rating (0-5 scale)
  genericBonus:    10,  // Bonus for being a verified generic
} as const;

const LOW_STOCK_THRESHOLD = 10;

// ─── SQL Field Selection ──────────────────────────────────────────────────────

const DRUG_ALTERNATIVE_FIELDS = `
  drug_id AS "drugId",
  brand_name AS "brandName",
  salt_composition AS "saltComposition",
  strength,
  dosage_form AS "dosageForm",
  manufacturer,
  estimated_price AS "estimatedPrice",
  is_generic AS "isGeneric",
  trust_rating AS "trustRating",
  uses,
  side_effects AS "sideEffects",
  contraindications,
  prescription_required AS "prescriptionRequired"
`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class AlternativesService {

  /**
   * Find and rank alternatives for a given drug.
   *
   * Algorithm:
   * 1. Retrieve the source drug from master_pharmacy
   * 2. Find all drugs sharing the same salt_composition (active ingredient)
   * 3. Score each alternative using configurable weights
   * 4. Return sorted results (highest score first)
   *
   * This is purely deterministic — no AI involved.
   */
  static async getAlternatives(
    drugId: string,
    options?: { budget?: number; dosageForm?: string; strength?: string; limit?: number }
  ): Promise<{ sourceDrug: DrugRow; alternatives: ScoredAlternative[] }> {

    // Check cache first
    const cacheKey = `alternatives:${drugId}`;
    const cached = await getCache<{ sourceDrug: DrugRow; alternatives: ScoredAlternative[] }>(cacheKey);
    if (cached && !options?.budget) return cached;

    // 1. Retrieve source drug
    const sourceDrug = await AlternativesService.getDrugById(drugId);

    // 2. Find alternatives by same salt composition
    const saltComposition = sourceDrug.saltComposition.trim().toLowerCase();
    const candidates = await query<DrugRow>(
      `SELECT ${DRUG_ALTERNATIVE_FIELDS}
       FROM master_pharmacy
       WHERE LOWER(salt_composition) = LOWER($1)
         AND drug_id != $2
       ORDER BY estimated_price ASC`,
      [saltComposition, drugId]
    );

    // 3. Score and rank
    const sourcePrice = Number(sourceDrug.estimatedPrice);
    const sourceStrength = AlternativesService.normalizeStrength(sourceDrug.strength);
    const sourceDosageForm = (sourceDrug.dosageForm || '').trim().toLowerCase();

    const scored: ScoredAlternative[] = candidates.map((candidate) => {
      const candidatePrice = Number(candidate.estimatedPrice);
      const candidateStrength = AlternativesService.normalizeStrength(candidate.strength);
      const candidateDosageForm = (candidate.dosageForm || '').trim().toLowerCase();

      const sameStrength = sourceStrength === candidateStrength;
      const sameDosageForm = sourceDosageForm === candidateDosageForm;
      const priceDifference = candidatePrice - sourcePrice;
      const priceDifferencePercent = sourcePrice > 0
        ? ((candidatePrice - sourcePrice) / sourcePrice) * 100
        : 0;

      // Calculate score components
      let score = 0;

      // Strength match bonus
      if (sameStrength) score += RANKING_WEIGHTS.sameStrength;

      // Dosage form match bonus
      if (sameDosageForm) score += RANKING_WEIGHTS.sameDosageForm;

      // Price savings score: higher savings = higher score
      if (sourcePrice > 0 && priceDifference < 0) {
        const savingsPercent = Math.abs(priceDifferencePercent);
        score += (savingsPercent / 100) * RANKING_WEIGHTS.priceSavings;
      }

      // Trust rating contribution (0-5 scale → 0-25 points)
      const trustRating = Number(candidate.trustRating);
      score += (trustRating / 5) * RANKING_WEIGHTS.trustRating;

      // Generic bonus
      if (candidate.isGeneric) score += RANKING_WEIGHTS.genericBonus;

      return {
        drugId: candidate.drugId,
        brandName: candidate.brandName,
        saltComposition: candidate.saltComposition,
        strength: candidate.strength,
        dosageForm: candidate.dosageForm,
        manufacturer: candidate.manufacturer,
        estimatedPrice: candidatePrice,
        isGeneric: candidate.isGeneric,
        trustRating,
        score: Math.round(score * 100) / 100,
        matchDetails: {
          sameActiveIngredient: true, // Always true — we query by same salt
          sameStrength,
          sameDosageForm,
          priceDifference: Math.round(priceDifference * 100) / 100,
          priceDifferencePercent: Math.round(priceDifferencePercent * 100) / 100,
        },
      };
    });

    // 4. Apply optional filters
    let filtered = scored;

    if (options?.budget) {
      filtered = filtered.filter((d) => d.estimatedPrice <= options.budget!);
    }
    if (options?.dosageForm) {
      const form = options.dosageForm.trim().toLowerCase();
      filtered = filtered.filter((d) => (d.dosageForm || '').toLowerCase() === form);
    }
    if (options?.strength) {
      const strength = AlternativesService.normalizeStrength(options.strength);
      filtered = filtered.filter((d) => AlternativesService.normalizeStrength(d.strength) === strength);
    }

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    // Apply limit
    const limit = options?.limit || 20;
    filtered = filtered.slice(0, limit);

    const result = { sourceDrug, alternatives: filtered };

    // Cache for 1 hour (only unfiltered results)
    if (!options?.budget && !options?.dosageForm && !options?.strength) {
      await setCache(cacheKey, result, 3600);
    }

    logger.info(`Alternatives found for drug ${drugId}: ${filtered.length} results`);
    return result;
  }

  /**
   * Compare two or more drugs side-by-side.
   * Returns structured comparison data from the database.
   * AI is NOT used for comparison — only database facts.
   */
  static async compareDrugs(drugIds: string[]): Promise<DrugComparison[]> {
    if (drugIds.length < 2) {
      throw new Error('At least 2 drug IDs are required for comparison');
    }
    if (drugIds.length > 5) {
      throw new Error('Maximum 5 drugs can be compared at once');
    }

    // Build parameterized placeholders: $1, $2, $3...
    const placeholders = drugIds.map((_, i) => `$${i + 1}`).join(', ');

    const drugs = await query<DrugComparison>(
      `SELECT
        drug_id AS "drugId",
        brand_name AS "brandName",
        salt_composition AS "genericName",
        manufacturer,
        strength,
        dosage_form AS "dosageForm",
        estimated_price AS "estimatedPrice",
        is_generic AS "isGeneric",
        trust_rating AS "trustRating",
        uses,
        side_effects AS "sideEffects",
        contraindications,
        prescription_required AS "prescriptionRequired"
       FROM master_pharmacy
       WHERE drug_id IN (${placeholders})`,
      drugIds
    );

    if (drugs.length === 0) {
      throw new Error('No drugs found for the provided IDs');
    }

    // Preserve the order of requested IDs
    const drugMap = new Map(drugs.map((d) => [d.drugId, d]));
    const ordered: DrugComparison[] = [];
    for (const id of drugIds) {
      const drug = drugMap.get(id);
      if (drug) {
        ordered.push({
          ...drug,
          estimatedPrice: Number(drug.estimatedPrice),
          trustRating: Number(drug.trustRating),
        });
      }
    }

    return ordered;
  }

  /**
   * Get a single drug by ID. Throws if not found.
   */
  private static async getDrugById(drugId: string): Promise<DrugRow> {
    const [drug] = await query<DrugRow>(
      `SELECT ${DRUG_ALTERNATIVE_FIELDS} FROM master_pharmacy WHERE drug_id = $1`,
      [drugId]
    );
    if (!drug) {
      throw new Error('Drug not found');
    }
    return {
      ...drug,
      estimatedPrice: Number(drug.estimatedPrice),
      trustRating: Number(drug.trustRating),
    };
  }

  /**
   * Normalize strength string for comparison.
   * Examples: "500 mg" → "500mg", "10MG" → "10mg"
   */
  private static normalizeStrength(strength: string): string {
    if (!strength) return '';
    return strength
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')       // Remove whitespace: "500 mg" → "500mg"
      .replace(/(\d+)(mg|ml|mcg|g|iu)/i, '$1$2'); // Standardize units
  }
}
