import { query } from '../config/database';
import { logger } from '../config/logger';
import { WebSearchService } from './webSearch.service';
import { ClinicalSafetyService } from './clinicalSafety.service';

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
  requiresReview?: boolean;
  flagReason?: string;
}

export interface ValidationSummary {
  totalMedicines: number;
  matchedCount: number;
  unknownCount: number;
  overallConfidence: number;
  flaggedForReviewCount: number;
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

// ─── Brand Name Cleaner ───────────────────────────────────────────────────────
// Strips OCR artefacts that prevent exact DB lookup:
//   "1. Tab. Bisoren 2.5"  →  "Bisoren"
//   "Cap. Amoxil 500mg"   →  "Amoxil"
export function cleanBrandForMatching(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  s = s.replace(/^\d+[\.)\-:\s]+\s*/, '');                                         // leading number
  s = s.replace(/^(?:Tab|Cap|Syp|Inj|Syr|Tap|T96|Ta6|Tob|Tal|Tol|Tos|TGb|Cqp)[.:\s]+/i, ''); // form prefix
  s = s.replace(/\s+\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu)?$/i, '');                 // trailing strength
  return s.trim();
}

// ─── Deterministic & Fuzzy Matching Service ────────────────────────────────────
export class MedicineMatchingService {
  /**
   * Main matching function: matches an OCR extracted medicine record against master_pharmacy
   */
  public static async matchMedicine(
    input: ExtractedMedicineInput,
    diagnosisContext: string = ''
  ): Promise<ValidatedMedicineResult> {
    const rawBrand   = (input.brandName || input.rawText || '').trim();
    const cleanBrand = cleanBrandForMatching(rawBrand);          // strip OCR noise before DB lookup
    const rawGeneric = (input.genericName || '').trim();
    const rawStrength = input.strength || input.dosage || '';

    const { normalized: normStrength, verified: strengthVerified } = normalizeStrength(rawStrength);

    // 1. Exact Match by Brand Name (try cleaned name first, then raw)
    const brandCandidates = [...new Set([cleanBrand, rawBrand].filter(Boolean))];
    for (const candidate of brandCandidates) {
      const exactBrandMatches = await query<MatchedDrug>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
         FROM master_pharmacy
         WHERE LOWER(brand_name) = LOWER($1)
         LIMIT 5`,
        [candidate]
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
    } // end brandCandidates loop

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

    // 3. PostgreSQL Trigram Similarity Search on Brand Name (handles OCR typos directly in DB)
    const fuzzyBrand = cleanBrand || rawBrand;
    if (fuzzyBrand.length >= 2) {
      const trigramBrandMatches = await query<MatchedDrug & { sm: number }>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice",
                similarity(brand_name, $1) AS sm
         FROM master_pharmacy
         WHERE similarity(brand_name, $1) >= 0.35
            OR LOWER(brand_name) LIKE LOWER($2)
         ORDER BY sm DESC
         LIMIT 10`,
        [fuzzyBrand, `${fuzzyBrand}%`]
      );

      if (trigramBrandMatches.length > 0) {
        const bestMatch = trigramBrandMatches[0];
        const bestScore = Number(bestMatch.sm) || similarityScore(fuzzyBrand, bestMatch.brandName);
        if (bestScore >= 0.40) {
          return {
            input,
            matched: true,
            matchType: 'FUZZY_BRAND',
            confidence: Math.round(bestScore * 90) / 100,
            matchedDrug: bestMatch,
            normalizedStrength: normStrength,
            strengthVerified,
            alternatives: trigramBrandMatches.slice(1, 5),
          };
        }
      }
    }

    // 4. Google Web Search & Pharmaceutical Grounding Pipeline (queries Google / Web knowledge for OCR correction)
    if (rawBrand.length >= 2) {
      const suggestedBrand = await WebSearchService.suggestCorrectDrugName(
        rawBrand,
        'Tab',
        input.dosage || input.strength,
        diagnosisContext
      );
      if (suggestedBrand) {
        const webMatches = await query<MatchedDrug>(
          `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition",
                  strength, dosage_form AS "dosageForm", manufacturer, estimated_price AS "estimatedPrice"
           FROM master_pharmacy
           WHERE LOWER(brand_name) = LOWER($1) OR LOWER(brand_name) LIKE LOWER($2)
           LIMIT 10`,
          [suggestedBrand, `%${suggestedBrand}%`]
        );
        if (webMatches.length > 0) {
          logger.info(`[WEB SEARCH MATCH SUCCESS] Matched "${rawBrand}" to master drug: "${webMatches[0].brandName}" via web suggestion "${suggestedBrand}"`);
          return {
            input,
            matched: true,
            matchType: 'FUZZY_BRAND',
            confidence: 0.90,
            matchedDrug: webMatches[0],
            normalizedStrength: normStrength,
            strengthVerified,
            alternatives: webMatches.slice(1, 4),
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
   * Batch validates an entire prescription payload & runs clinical coherence safety checks
   */
  public static async validatePrescriptionPayload(medicinesInput: ExtractedMedicineInput[], diagnosisText: string = ''): Promise<ValidationSummary> {
    const results: ValidatedMedicineResult[] = [];
    let matchedCount = 0;
    let totalConfidenceSum = 0;

    for (const medInput of medicinesInput) {
      const res = await MedicineMatchingService.matchMedicine(medInput, diagnosisText);
      results.push(res);
      if (res.matched) matchedCount++;
      totalConfidenceSum += res.confidence;
    }

    // Run TASK-005 / TASK-006 Clinical Safety & Coherence Check
    const safetyInputs = results.map(r => ({
      brandName: r.matchedDrug ? r.matchedDrug.brandName : (r.input.brandName || 'Unknown'),
      genericName: r.matchedDrug ? r.matchedDrug.saltComposition : r.input.genericName,
      matchScore: r.confidence,
      matchType: r.matchType,
    }));
    const safetyEvaluations = ClinicalSafetyService.evaluateClinicalCoherence(safetyInputs, diagnosisText);

    let flaggedCount = 0;
    results.forEach((r, idx) => {
      const evalResult = safetyEvaluations[idx];
      if (evalResult) {
        r.requiresReview = evalResult.requiresReview;
        r.flagReason = evalResult.flagReason;
        if (evalResult.requiresReview) flaggedCount++;
      }
    });

    const total = medicinesInput.length;
    const overallConfidence = total > 0 ? Math.round((totalConfidenceSum / total) * 100) / 100 : 0.0;

    return {
      totalMedicines: total,
      matchedCount,
      unknownCount: total - matchedCount,
      overallConfidence,
      flaggedForReviewCount: flaggedCount,
      medicines: results,
    };
  }
}
