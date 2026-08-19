import { describe, test, expect } from './runner';
import { ClinicalSafetyService, MedicineValidationItem } from '../src/services/clinicalSafety.service';

export async function runClinicalSafetyTests() {
  await describe('Clinical Safety Service (Unit Tests)', async () => {
    await test('Correctly identifies cardiovascular regimen medicines without review flag', () => {
      const input: MedicineValidationItem[] = [
        { brandName: 'Aztor 10', genericName: 'Atorvastatin', matchScore: 0.95, matchType: 'EXACT_BRAND' },
        { brandName: 'Bisoren 2.5', genericName: 'Bisoprolol', matchScore: 0.90, matchType: 'EXACT_BRAND' },
      ];

      const results = ClinicalSafetyService.evaluateClinicalCoherence(input, 'HTN, Post PCI');
      expect(results.length).toBe(2);
      expect(results[0].coherenceCategory).toBe('CARDIOVASCULAR');
      expect(results[0].requiresReview).toBe(false);
      expect(results[1].coherenceCategory).toBe('CARDIOVASCULAR');
      expect(results[1].requiresReview).toBe(false);
    });

    await test('Flags low-confidence unaligned / unusual drug matches', () => {
      const input: MedicineValidationItem[] = [
        { brandName: 'Elopag 50', genericName: 'Eltrombopag', matchScore: 0.55, matchType: 'FUZZY_BRAND' },
      ];

      const results = ClinicalSafetyService.evaluateClinicalCoherence(input, 'BPPV, Vertigo, HTN');
      expect(results.length).toBe(1);
      expect(results[0].coherenceCategory).toBe('UNUSUAL');
      expect(results[0].requiresReview).toBe(true);
      expect(results[0].flagReason).toBeDefined();
      expect(results[0].flagReason!).toContain('Low match confidence');
    });

    await test('Correctly classifies Vertigo / Neuro drugs', () => {
      const input: MedicineValidationItem[] = [
        { brandName: 'Verserc', genericName: 'Betahistine', matchScore: 0.88, matchType: 'EXACT_BRAND' },
        { brandName: 'Stemetil', genericName: 'Prochlorperazine', matchScore: 0.92, matchType: 'EXACT_BRAND' },
      ];

      const results = ClinicalSafetyService.evaluateClinicalCoherence(input, 'BPPV / Dizziness');
      expect(results[0].coherenceCategory).toBe('NEURO_VERTIGO');
      expect(results[0].requiresReview).toBe(false);
      expect(results[1].coherenceCategory).toBe('NEURO_VERTIGO');
      expect(results[1].requiresReview).toBe(false);
    });

    await test('Correctly classifies GI / Gastro drugs', () => {
      const input: MedicineValidationItem[] = [
        { brandName: 'Lanso 30', genericName: 'Lansoprazole', matchScore: 0.95, matchType: 'EXACT_BRAND' },
        { brandName: 'Ezylife', genericName: 'Bisacodyl', matchScore: 0.85, matchType: 'EXACT_BRAND' },
      ];

      const results = ClinicalSafetyService.evaluateClinicalCoherence(input, 'GERD, Constipation');
      expect(results[0].coherenceCategory).toBe('GI_GASTRO');
      expect(results[0].requiresReview).toBe(false);
      expect(results[1].coherenceCategory).toBe('GI_GASTRO');
      expect(results[1].requiresReview).toBe(false);
    });
  });
}
