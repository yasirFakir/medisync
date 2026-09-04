package com.medisync.android.core.rag

import com.medisync.android.data.model.PrescriptionMedicineDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MedicineMatchingEngineTest {

    @Test
    fun `test exact brand match for Napa Extra resolves manufacturer and active ingredients`() {
        val raw = PrescriptionMedicineDto(
            brandName = "Napa Extra",
            saltComposition = "Paracetamol",
            dosage = "1 tab",
            frequency = "1+0+1",
            duration = "5 days"
        )

        val result = MedicineMatchingEngine.matchSingleMedicine(raw)
        assertEquals(MatchType.EXACT_BRAND, result.matchType)
        assertEquals("Napa Extra", result.normalizedBrand)
        assertEquals("Paracetamol + Caffeine", result.verifiedSaltComposition)
        assertEquals("Beximco Pharma", result.matchedDrug?.manufacturer)
        assertEquals(1.0, result.confidence, 0.01)
    }

    @Test
    fun `test fuzzy brand match for OCR typo Fexo resolves to Fexo 120mg`() {
        val raw = PrescriptionMedicineDto(
            brandName = "Fex 120",
            saltComposition = "Fexofenadine",
            dosage = "120mg",
            frequency = "0+0+1",
            duration = "7 days"
        )

        val result = MedicineMatchingEngine.matchSingleMedicine(raw)
        assertTrue(result.matchType == MatchType.FUZZY_BRAND || result.matchType == MatchType.EXACT_GENERIC)
        assertEquals("Fexofenadine HCl", result.verifiedSaltComposition)
        assertNotNull(result.matchedDrug)
    }

    @Test
    fun `test exact generic match for Amoxicillin resolves to antibiotic monograph`() {
        val raw = PrescriptionMedicineDto(
            brandName = "Amoxicillin",
            saltComposition = "Amoxicillin Trihydrate",
            dosage = "500mg",
            frequency = "1+1+1",
            duration = "7 days"
        )

        val result = MedicineMatchingEngine.matchSingleMedicine(raw)
        assertTrue(result.matchType == MatchType.EXACT_BRAND || result.matchType == MatchType.EXACT_GENERIC)
        assertEquals("Amoxicillin Trihydrate", result.verifiedSaltComposition)
        assertEquals("500mg", result.normalizedDosage)
    }

    @Test
    fun `test matchPrescription batch pipeline normalizes entire prescription`() {
        val rawList = listOf(
            PrescriptionMedicineDto("Tab. Napa", "Paracetamol", "500mg", "twice daily", "5 days"),
            PrescriptionMedicineDto("Monas 10mg", "Montelukast", "10mg", "at night", "14 days")
        )

        val matched = MedicineMatchingEngine.matchPrescription(rawList)
        assertEquals(2, matched.size)
        assertEquals("Napa", matched[0].brandName)
        assertEquals("1+0+1", matched[0].frequency)
        assertEquals("0+0+1", matched[1].frequency)
    }
}
