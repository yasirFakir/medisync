import { query } from '../config/database';
import { logger } from '../config/logger';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ExtractedMedicineInput {
  rawText?: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface MatchedDrug {
  drugId: string;
  brandName: string;
  saltComposition: string;
  strength: string;
  dosageForm: string | null;
  manufacturer: string | null;
  estimatedPrice: number;
}

export interface ValidatedMedicineResult {
  input: ExtractedMedicineInput;
  matched: boolean;
  matchType: 'EXACT_BRAND' | 'EXACT_GENERIC' | 'FUZZY_BRAND' | 'FUZZY_GENERIC' | 'UNKNOWN';
  confidence: number; // 0.00 - 1.00
  matchedDrug: MatchedDrug | null;
  normalizedStrength: string | null;
  strengthVerified: boolean;
  alternatives: MatchedDrug[];
}

export interface ValidationSummary {
  totalMedicines: number;
  matchedCount: number;
  unknownCount: number;
  overallConfidence: number;
  medicines: ValidatedMedicineResult[];
}

// ─── Levenshtein Distance Helper ─────────────────────────────────────────────
export function levenshteinDistance(a: string, b: string): number {
  const str1 = a.toLowerCase().trim();
  const str2 = b.toLowerCase().trim();
  const matrix: number[][] = [];

  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[str1.length][str2.length];
}

export function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(str1, str2);
  return Math.max(0, (maxLen - dist) / maxLen);
}

// ─── Strength Normalizer ──────────────────────────────────────────────────────
export function normalizeStrength(strengthInput: string): { normalized: string | null; verified: boolean } {
  if (!strengthInput) return { normalized: null, verified: false };
  let str = strengthInput.trim().toLowerCase();

  // Common OCR typos for mg / ml / mcg / gm
  str = str.replace(/(\d+)\s*mq\b/g, '$1mg');
  str = str.replace(/(\d+)\s*m9\b/g, '$1mg');
  str = str.replace(/(\d+)\s*r9\b/g, '$1mg');
  str = str.replace(/(\d+)\s*g\b/g, '$1mg');

  const match = str.match(/(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|iu)/i);
  if (match) {
    return {
      normalized: `${match[1]}${match[2].toLowerCase()}`,
      verified: true,
    };
  }

  return { normalized: strengthInput, verified: false };
}

// ─── Deterministic & Fuzzy Matching Service ────────────────────────────────────
export class MedicineMatchingService {
  /**
   * Main matching function: matches an OCR extracted medicine record against master_pharmacy
   */
  public static async matchMedicine(input: ExtractedMedicineInput): Promise<ValidatedMedicineResult> {
    const rawBrand = (input.brandName || input.rawText || '').trim();
    const rawGeneric = (input.genericName || '').trim();
    const rawStrength = input.strength || input.dosage || '';

    const { normalized: normStrength, verified: strengthVerified } = normalizeStrength(rawStrength);

    // 1. Exact Match by Brand Name
    if (rawBrand) {
      const exactBrandMatches = await query<MatchedDrug>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
         FROM master_pharmacy
         WHERE LOWER(brand_name) = LOWER($1)
         LIMIT 5`,
        [rawBrand]
      );

      if (exactBrandMatches.length > 0) {
        const best = exactBrandMatches[0];
        return {
          input,
          matched: true,
          matchType: 'EXACT_BRAND',
          confidence: 0.98,
          matchedDrug: best,
          normalizedStrength: normStrength,
          strengthVerified,
          alternatives: exactBrandMatches.slice(1),
        };
      }
    }

    // 2. Exact Match by Generic / Salt Composition
    if (rawGeneric) {
      const exactGenericMatches = await query<MatchedDrug>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
         FROM master_pharmacy
         WHERE LOWER(salt_composition) = LOWER($1)
         ORDER BY trust_rating DESC LIMIT 5`,
        [rawGeneric]
      );

      if (exactGenericMatches.length > 0) {
        const best = exactGenericMatches[0];
        return {
          input,
          matched: true,
          matchType: 'EXACT_GENERIC',
          confidence: 0.92,
          matchedDrug: best,
          normalizedStrength: normStrength,
          strengthVerified,
          alternatives: exactGenericMatches.slice(1),
        };
      }
    }

    // 3. PostgreSQL Trigram / Partial Fuzzy Match on Brand Name
    if (rawBrand.length >= 3) {
      const fuzzyBrandMatches = await query<MatchedDrug>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
         FROM master_pharmacy
         WHERE LOWER(brand_name) LIKE LOWER($1)
         LIMIT 10`,
        [`%${rawBrand}%`]
      );

      if (fuzzyBrandMatches.length > 0) {
        // Calculate Levenshtein similarity score for best candidate
        let bestMatch: MatchedDrug | null = null;
        let bestScore = 0;
        const alts: MatchedDrug[] = [];

        for (const item of fuzzyBrandMatches) {
          const score = similarityScore(rawBrand, item.brandName);
          if (score > bestScore) {
            if (bestMatch) alts.push(bestMatch);
            bestMatch = item;
            bestScore = score;
          } else {
            alts.push(item);
          }
        }

        if (bestMatch && bestScore >= 0.6) {
          return {
            input,
            matched: true,
            matchType: 'FUZZY_BRAND',
            confidence: Math.round(bestScore * 90) / 100,
            matchedDrug: bestMatch,
            normalizedStrength: normStrength,
            strengthVerified,
            alternatives: alts.slice(0, 4),
          };
        }
      }
    }

    // 4. PostgreSQL Trigram / Partial Fuzzy Match on Generic Name
    if (rawGeneric.length >= 3) {
      const fuzzyGenericMatches = await query<MatchedDrug>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
         FROM master_pharmacy
         WHERE LOWER(salt_composition) LIKE LOWER($1)
         LIMIT 10`,
        [`%${rawGeneric}%`]
      );

      if (fuzzyGenericMatches.length > 0) {
        let bestMatch: MatchedDrug | null = null;
        let bestScore = 0;
        const alts: MatchedDrug[] = [];

        for (const item of fuzzyGenericMatches) {
          const score = similarityScore(rawGeneric, item.saltComposition);
          if (score > bestScore) {
            if (bestMatch) alts.push(bestMatch);
            bestMatch = item;
            bestScore = score;
          } else {
            alts.push(item);
          }
        }

        if (bestMatch && bestScore >= 0.55) {
          return {
            input,
            matched: true,
            matchType: 'FUZZY_GENERIC',
            confidence: Math.round(bestScore * 85) / 100,
            matchedDrug: bestMatch,
            normalizedStrength: normStrength,
            strengthVerified,
            alternatives: alts.slice(0, 4),
          };
        }
      }
    }

    // 5. Unknown Medicine Handling (never fail or fabricate)
    return {
      input,
      matched: false,
      matchType: 'UNKNOWN',
      confidence: 0.0,
      matchedDrug: null,
      normalizedStrength: normStrength,
      strengthVerified,
      alternatives: [],
    };
  }

  /**
   * Batch validates an entire prescription payload
   */
  public static async validatePrescriptionPayload(medicinesInput: ExtractedMedicineInput[]): Promise<ValidationSummary> {
    const results: ValidatedMedicineResult[] = [];
    let matchedCount = 0;
    let totalConfidenceSum = 0;

    for (const medInput of medicinesInput) {
      const res = await MedicineMatchingService.matchMedicine(medInput);
      results.push(res);
      if (res.matched) matchedCount++;
      totalConfidenceSum += res.confidence;
    }

    const total = medicinesInput.length;
    const overallConfidence = total > 0 ? Math.round((totalConfidenceSum / total) * 100) / 100 : 0.0;

    return {
      totalMedicines: total,
      matchedCount,
      unknownCount: total - matchedCount,
      overallConfidence,
      medicines: results,
    };
  }
}
