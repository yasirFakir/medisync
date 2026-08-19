import { describe, test, expect } from './runner';
import {
  levenshteinDistance,
  similarityScore,
  normalizeStrength,
  cleanBrandForMatching
} from '../src/services/matching.service';

export async function runMatchingUnitTests() {
  await describe('Medicine Matching Utilities (Unit Tests)', async () => {
    await test('levenshteinDistance correctly calculates edit distances', () => {
      expect(levenshteinDistance('Napa', 'Napa')).toBe(0);
      expect(levenshteinDistance('Napa', 'napa')).toBe(0); // case-insensitive
      // 'Amoxilin' (8 chars) vs 'Amoxicillin' (11 chars): diff is 'c' and 'l' (insert 'c', insert 'l', delete/sub -> distance 3)
      expect(levenshteinDistance('Amoxilin', 'Amoxicillin')).toBe(3);
      expect(levenshteinDistance('Paracetamol', 'Paracetmol')).toBe(1);
      expect(levenshteinDistance('Aztox', 'Aztor')).toBe(1);
    });

    await test('similarityScore computes bounded 0.0 - 1.0 confidence score', () => {
      expect(similarityScore('Napa', 'Napa')).toBe(1.0);
      expect(similarityScore('Napa Extra', 'Napa')).toBeGreaterThan(0.3);
      expect(similarityScore('Amoxil', 'Amoxil 500')).toBeGreaterThan(0.5);
      expect(similarityScore('Paracetamol', 'Paracetmol')).toBeGreaterThan(0.9);
      expect(similarityScore('', '')).toBe(1.0);
    });

    await test('normalizeStrength corrects common OCR noise and variations', () => {
      const res1 = normalizeStrength('500 mq');
      expect(res1.normalized).toBe('500mg');
      expect(res1.verified).toBe(true);

      const res2 = normalizeStrength('500 m9');
      expect(res2.normalized).toBe('500mg');
      expect(res2.verified).toBe(true);

      const res3 = normalizeStrength('100 ml');
      expect(res3.normalized).toBe('100ml');
      expect(res3.verified).toBe(true);

      const res4 = normalizeStrength('10 mcg');
      expect(res4.normalized).toBe('10mcg');
      expect(res4.verified).toBe(true);

      const resEmpty = normalizeStrength('');
      expect(resEmpty.normalized).toBeNull();
      expect(resEmpty.verified).toBe(false);
    });

    await test('cleanBrandForMatching strips prefixes, leading numbers and dosage suffixes', () => {
      expect(cleanBrandForMatching('1. Tab. Bisoren 2.5')).toBe('Bisoren');
      expect(cleanBrandForMatching('2) Cap. Amoxil 500mg')).toBe('Amoxil');
      expect(cleanBrandForMatching('3. Syp. Tuspel 100ml')).toBe('Tuspel');
      expect(cleanBrandForMatching('Tab Aztor 10')).toBe('Aztor');
      expect(cleanBrandForMatching('Napa Extra')).toBe('Napa Extra');
      expect(cleanBrandForMatching('')).toBe('');
    });
  });
}
