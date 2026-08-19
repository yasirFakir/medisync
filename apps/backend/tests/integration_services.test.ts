import { describe, test, expect } from './runner';
import { query } from '../src/config/database';
import { AlternativesService } from '../src/services/alternatives.service';
import { MedicineMatchingService } from '../src/services/matching.service';
import { AdminService } from '../src/services/admin.service';

export async function runIntegrationServicesTests() {
  await describe('Backend Core Services & Database Integration Tests', async () => {
    
    await test('AlternativesService.getAlternatives finds matching salt composition alternatives', async () => {
      // Find an existing drug in master_pharmacy
      const drugs = await query<{ drug_id: string; brand_name: string; salt_composition: string }>(
        `SELECT drug_id, brand_name, salt_composition FROM master_pharmacy WHERE salt_composition IS NOT NULL LIMIT 1`
      );
      if (!drugs.length) {
        console.log('    ℹ Skipped: No drugs in master_pharmacy');
        return;
      }
      const drug = drugs[0];
      const result = await AlternativesService.getAlternatives(drug.drug_id);
      expect(result).toBeDefined();
      expect(result.sourceDrug).toBeDefined();
      expect(result.sourceDrug.drugId).toBe(drug.drug_id);
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    await test('AlternativesService.compareDrugs compares multiple drugs', async () => {
      const drugs = await query<{ drug_id: string }>(
        `SELECT drug_id FROM master_pharmacy LIMIT 2`
      );
      if (drugs.length < 2) {
        console.log('    ℹ Skipped: master_pharmacy has fewer than 2 drugs');
        return;
      }
      const comparison = await AlternativesService.compareDrugs([drugs[0].drug_id, drugs[1].drug_id]);
      expect(comparison.length).toBe(2);
      expect(comparison[0].drugId).toBe(drugs[0].drug_id);
      expect(comparison[1].drugId).toBe(drugs[1].drug_id);
    });

    await test('MedicineMatchingService.matchMedicine matches exact brand correctly', async () => {
      const sample = await query<{ brand_name: string }>(
        `SELECT brand_name FROM master_pharmacy WHERE brand_name IS NOT NULL LIMIT 1`
      );
      if (!sample.length) return;

      const res = await MedicineMatchingService.matchMedicine({ brandName: sample[0].brand_name });
      expect(res.matched).toBe(true);
      expect(res.matchType).toBe('EXACT_BRAND');
      expect(res.confidence).toBeGreaterThan(0.9);
      expect(res.matchedDrug).toBeDefined();
    });

    await test('MedicineMatchingService.matchMedicine handles unknown medicine safely', async () => {
      const res = await MedicineMatchingService.matchMedicine({ brandName: 'XyZ_Totally_NonExistent_Medicine_123' });
      expect(res.matched).toBe(false);
      expect(res.matchType).toBe('UNKNOWN');
      expect(res.confidence).toBe(0);
      expect(res.matchedDrug).toBeNull();
    });

    await test('MedicineMatchingService.validatePrescriptionPayload validates batch of medicines with safety check', async () => {
      const sample = await query<{ brand_name: string }>(
        `SELECT brand_name FROM master_pharmacy WHERE brand_name IS NOT NULL LIMIT 2`
      );
      if (sample.length < 2) return;

      const input = [
        { brandName: sample[0].brand_name },
        { brandName: 'NonExistentDrugName999' }
      ];
      const summary = await MedicineMatchingService.validatePrescriptionPayload(input, 'HTN, CARDIAC');
      expect(summary.totalMedicines).toBe(2);
      expect(summary.matchedCount).toBeGreaterThanOrEqual(1);
      expect(summary.medicines.length).toBe(2);
    });

    await test('AdminService.getDashboardStats returns system statistics', async () => {
      const stats = await AdminService.getDashboardStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.totalPharmacies).toBe('number');
      expect(typeof stats.totalDrugs).toBe('number');
    });

    await test('AdminService.listUsers returns paginated list of users', async () => {
      const res = await AdminService.listUsers({ page: 1, limit: 5 });
      expect(res).toBeDefined();
      expect(Array.isArray(res.users)).toBe(true);
      expect(res.pagination).toBeDefined();
      expect(res.pagination.page).toBe(1);
    });

    await test('AdminService.listPharmacies returns paginated list of pharmacies', async () => {
      const res = await AdminService.listPharmacies({ page: 1, limit: 5 });
      expect(res).toBeDefined();
      expect(Array.isArray(res.pharmacies)).toBe(true);
      expect(res.pagination).toBeDefined();
      expect(res.pagination.page).toBe(1);
    });
  });
}
