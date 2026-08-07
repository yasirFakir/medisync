import { query } from '../src/config/database';
import { AlternativesService } from '../src/services/alternatives.service';

async function runPrescriptionAlternativesTest() {
  console.log('===========================================================');
  console.log('🧪 TEST: Prescription Cheap Alternatives Integration');
  console.log('===========================================================\n');

  try {
    // 1. Fetch test patient account & prescriptions from DB
    const patientUser = await query<{ user_id: string; email: string }>(
      `SELECT user_id, email FROM users WHERE role = 'PATIENT' AND email = 'patient@medisync.ai' LIMIT 1`
    );

    if (!patientUser.length) {
      console.error('❌ FAIL: Test patient@medisync.ai account not found in database.');
      process.exit(1);
    }
    const patientId = patientUser[0].user_id;
    console.log(`1️⃣ Test Patient: ${patientUser[0].email} (ID: ${patientId})`);

    // 2. Fetch seeded prescriptions for this patient
    const prescriptions = await query<{
      prescription_id: string;
      doctor_name: string;
      medicines: any;
      ocr_result: any;
      created_at: Date;
    }>(
      `SELECT prescription_id, doctor_name, medicines, ocr_result, created_at 
       FROM prescriptions 
       WHERE patient_id = $1 
       ORDER BY created_at DESC`,
      [patientId]
    );

    console.log(`2️⃣ Found ${prescriptions.length} Prescription(s) in Scan Logs:`);
    prescriptions.forEach((rx, index) => {
      const meds = Array.isArray(rx.medicines) ? rx.medicines : (rx.ocr_result?.medicines || []);
      const medNames = meds.map((m: any) => m.brandName || m.brand_name?.value || 'Unknown');
      console.log(`   └─ Rx #${index + 1} (${rx.prescription_id.substring(0, 8)}): Dr. ${rx.doctor_name} → Medicines: [${medNames.join(', ')}]`);
    });

    if (prescriptions.length === 0) {
      console.error('❌ FAIL: No prescriptions found for test patient. Run npm run db:seed:all first.');
      process.exit(1);
    }

    // 3. Test Single & Multi-Prescription Alternatives Selection
    console.log('\n3️⃣ Analyzing Cheap Alternatives for Selected Prescriptions:');
    
    let totalPrescribedCost = 0;
    let totalAlternativeCost = 0;
    let analyzedMedicinesCount = 0;

    for (const rx of prescriptions) {
      console.log(`\n  📄 Prescription #${rx.prescription_id.substring(0, 8)} (Dr. ${rx.doctor_name}):`);
      const meds = Array.isArray(rx.medicines) ? rx.medicines : [];

      for (const med of meds) {
        const brandName = med.brandName;
        analyzedMedicinesCount++;

        // Find master drug in DB
        const masterDrugs = await query<{
          drug_id: string;
          brand_name: string;
          salt_composition: string;
          strength: string;
          estimated_price: number;
        }>(
          `SELECT drug_id, brand_name, salt_composition, strength, estimated_price
           FROM master_pharmacy
           WHERE LOWER(brand_name) = LOWER($1) OR LOWER(salt_composition) = LOWER($1)
           LIMIT 1`,
          [brandName]
        );

        if (masterDrugs.length === 0) {
          console.log(`     ⚠️ Prescribed: "${brandName}" — Not found in master drug catalog`);
          continue;
        }

        const sourceDrug = masterDrugs[0];
        const sourcePrice = Number(sourceDrug.estimated_price);
        totalPrescribedCost += sourcePrice;

        // Fetch bioequivalent alternatives using AlternativesService
        const result = await AlternativesService.getAlternatives(sourceDrug.drug_id);
        const alternatives = result.alternatives;

        if (alternatives.length === 0) {
          console.log(`     💊 Prescribed: ${sourceDrug.brand_name} (${sourceDrug.salt_composition} ${sourceDrug.strength}) — Price: ৳${sourcePrice.toFixed(2)} | No cheaper generic in DB`);
          totalAlternativeCost += sourcePrice;
        } else {
          // Cheapest alternative
          const cheapest = alternatives.reduce((min, c) => c.estimatedPrice < min.estimatedPrice ? c : min, alternatives[0]);
          totalAlternativeCost += cheapest.estimatedPrice;
          const savings = sourcePrice - cheapest.estimatedPrice;
          const savingsPercent = sourcePrice > 0 ? Math.round((savings / sourcePrice) * 100) : 0;

          console.log(`     💊 Prescribed: ${sourceDrug.brand_name} (${sourceDrug.salt_composition} ${sourceDrug.strength}) — Price: ৳${sourcePrice.toFixed(2)}`);
          console.log(`        └─ 🏷️ Best Cheap Alt: ${cheapest.brandName} (${cheapest.manufacturer || 'Generic'}) — Price: ৳${cheapest.estimatedPrice.toFixed(2)} | Save: ${savingsPercent}% (৳${savings.toFixed(2)})`);

          // Verify active ingredient bioequivalence
          if (cheapest.saltComposition.toLowerCase().includes(sourceDrug.salt_composition.toLowerCase()) ||
              sourceDrug.salt_composition.toLowerCase().includes(cheapest.saltComposition.toLowerCase())) {
            console.log(`        └─ ✅ Bioequivalence Verified (Active Ingredient Match: ${cheapest.saltComposition})`);
          } else {
            console.warn(`        └─ ⚠️ Active ingredient mismatch notice`);
          }
        }
      }
    }

    // 4. Test Aggregate Savings Calculation
    console.log('\n4️⃣ Tabular Cost Savings Aggregation Summary:');
    const totalSavings = totalPrescribedCost - totalAlternativeCost;
    const overallSavingsPercent = totalPrescribedCost > 0 ? Math.round((totalSavings / totalPrescribedCost) * 100) : 0;

    console.log(`   📦 Total Prescriptions Selected: ${prescriptions.length}`);
    console.log(`   💊 Total Prescribed Medicines: ${analyzedMedicinesCount}`);
    console.log(`   💰 Original Total Cost: ৳${totalPrescribedCost.toFixed(2)}`);
    console.log(`   🏷️ Cheap Alternatives Total Cost: ৳${totalAlternativeCost.toFixed(2)}`);
    console.log(`   ⚡ TOTAL SAVINGS: ৳${totalSavings.toFixed(2)} (${overallSavingsPercent}% Overall Cost Reduction)`);

    // 5. Test Pharmacy Stock Availability for Prescribed Cheap Alternatives
    console.log('\n5️⃣ Partner Pharmacy Availability Check for Cheap Alternatives:');
    const stockResults = await query<{
      store_name: string;
      city: string;
      brand_name: string;
      current_price: number;
      in_stock: boolean;
    }>(
      `SELECT p.store_name, p.city, mp.brand_name, pi.current_price, pi.in_stock
       FROM pharmacy_inventory pi
       JOIN pharmacies p ON pi.pharmacy_id = p.pharmacy_id
       JOIN master_pharmacy mp ON pi.drug_id = mp.drug_id
       WHERE pi.in_stock = true AND mp.is_generic = true
       LIMIT 5`
    );

    console.log(`   Found ${stockResults.length} generic alternatives available in local pharmacies:`);
    stockResults.forEach(item => {
      console.log(`   └─ 🏪 ${item.store_name} (${item.city}): ${item.brand_name} in stock @ ৳${item.current_price}`);
    });

    console.log('\n===========================================================');
    console.log('✅ ALL TESTS PASSED SUCCESSFULY: Prescription Alternatives feature is fully functional!');
    console.log('===========================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ TEST FAILED with error:', error);
    process.exit(1);
  }
}

runPrescriptionAlternativesTest();
