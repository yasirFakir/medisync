import { levenshteinDistance, similarityScore, normalizeStrength } from '../src/services/matching.service';

describe('Medicine Matching Service & Utilities Unit Tests', () => {
  test('levenshteinDistance computes exact distances', () => {
    expect(levenshteinDistance('Napa', 'Napa')).toBe(0);
    expect(levenshteinDistance('Amoxilin', 'Amoxicillin')).toBe(2);
    expect(levenshteinDistance('Paracetamol', 'Paracetmol')).toBe(1);
  });

  test('similarityScore computes normalized 0-1 similarity', () => {
    expect(similarityScore('Napa', 'Napa')).toBe(1.0);
    expect(similarityScore('Napa Extra', 'Napa')).toBeGreaterThan(0.3);
    expect(similarityScore('Amoxilin', 'Amoxicillin')).toBeGreaterThan(0.8);
  });

  test('normalizeStrength corrects common OCR typos', () => {
    expect(normalizeStrength('500 mq').normalized).toBe('500mg');
    expect(normalizeStrength('500 m9').normalized).toBe('500mg');
    expect(normalizeStrength('100 ml').normalized).toBe('100ml');
    expect(normalizeStrength('500mg').verified).toBe(true);
  });
});
