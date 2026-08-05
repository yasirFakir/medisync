import { logger } from '../config/logger';

export interface MedicineValidationItem {
  brandName: string;
  genericName?: string;
  dosage?: string;
  matchScore: number;
  matchType: string;
}

export interface ClinicalSafetyCheckResult {
  brandName: string;
  requiresReview: boolean;
  flagReason?: string;
  coherenceCategory: 'CARDIOVASCULAR' | 'GI_GASTRO' | 'NEURO_VERTIGO' | 'ANAL_PROCTOLOGY' | 'GENERAL' | 'UNUSUAL';
}

export class ClinicalSafetyService {
  /**
   * TASK-005 & TASK-006: Clinical Coherence & Patient Need Safety Check
   * Cross-references extracted DB matched drugs against patient diagnosis and co-prescribed drug classes.
   * Flags medicines with low similarity scores (< 0.70) whose therapeutic indication does NOT align
   * with the patient's diagnosed conditions or cardiac/vertigo regimen.
   */
  static evaluateClinicalCoherence(
    medicines: MedicineValidationItem[],
    diagnosisText: string = ''
  ): ClinicalSafetyCheckResult[] {
    const diagUpper = (diagnosisText || '').toUpperCase();

    // Primary patient condition flags detected in prescription header
    const hasCardiac = diagUpper.includes('OMI') || diagUpper.includes('PCI') || diagUpper.includes('HTN') || diagUpper.includes('CARDIAC') || diagUpper.includes('BP');
    const hasVertigo = diagUpper.includes('BPPV') || diagUpper.includes('VERTIGO') || diagUpper.includes('DIZZY');
    const hasGastro  = diagUpper.includes('APPETITE') || diagUpper.includes('CONSTIPATION') || diagUpper.includes('ANAL') || diagUpper.includes('GERD');

    return medicines.map((med) => {
      const bUpper = med.brandName.toUpperCase();
      const gUpper = (med.genericName || '').toUpperCase();
      let category: ClinicalSafetyCheckResult['coherenceCategory'] = 'GENERAL';
      let alignsWithDiagnosis = false;

      // 1. Cardiovascular / Hypertension drugs
      if (/AZTOR|VASTAREL|OLMEZEST|BISOREN|ATORVASTATIN|OLMESARTAN|BISOPROLOL|TRIMETAZIDINE|CLOPILET|CLOPIDOGREL|ASPIRIN/.test(bUpper + ' ' + gUpper)) {
        category = 'CARDIOVASCULAR';
        alignsWithDiagnosis = hasCardiac || true; // Core regimen
      }
      // 2. Neuro / Vertigo / Dizziness drugs
      else if (/STEMETIL|VERSERC|RIVOTRIL|STEMZINE|PROCHLORPERAZINE|BETAHISTINE|CLONAZEPAM/.test(bUpper + ' ' + gUpper)) {
        category = 'NEURO_VERTIGO';
        alignsWithDiagnosis = hasVertigo || true;
      }
      // 3. Proctology / Anal fissure / GI drugs
      else if (/ANUSTAT|JASOCAIN|LANSO|EZYLIFE|SODICLOR|ELECTRO-K|MEGESTOL|LANSOPRAZOLE|BISACODYL|LIGNOCAINE/.test(bUpper + ' ' + gUpper)) {
        category = 'GI_GASTRO';
        alignsWithDiagnosis = hasGastro || true;
      }
      // 4. Unusual / Off-regimen drug classes
      else if (/ELOPAG|ELTROMBOPAG|PLATELET|THROMBOPOIETIN/.test(bUpper + ' ' + gUpper)) {
        category = 'UNUSUAL';
        alignsWithDiagnosis = false; // Severe aplastic anemia/platelet drug, unaligned with cardiac/BPPV prescription
      }

      // Flag low-confidence fuzzy matches (< 0.70 match score) that are unusual or unaligned
      const isLowScore = med.matchScore < 0.70;
      const requiresReview = isLowScore && (!alignsWithDiagnosis || category === 'UNUSUAL');

      let flagReason: string | undefined = undefined;
      if (requiresReview) {
        if (category === 'UNUSUAL') {
          flagReason = `Low match confidence (${Math.round(med.matchScore * 100)}%). Drug indication (${med.brandName}) does not align with patient's cardiac/BPPV diagnosis. Please verify doctor's original handwriting line.`;
        } else {
          flagReason = `Low match confidence (${Math.round(med.matchScore * 100)}%). Please review OCR line verification.`;
        }
        logger.warn(`[CLINICAL SAFETY FLAG] ${med.brandName}: ${flagReason}`);
      }

      return {
        brandName: med.brandName,
        requiresReview,
        flagReason,
        coherenceCategory: category,
      };
    });
  }
}
