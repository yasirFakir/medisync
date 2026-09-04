package com.medisync.android.core.rag

import com.medisync.android.data.model.PrescriptionMedicineDto
import kotlin.math.max
import kotlin.math.min

enum class MatchType {
    EXACT_BRAND,
    FUZZY_BRAND,
    EXACT_GENERIC,
    FUZZY_GENERIC,
    UNKNOWN
}

data class MatchedMedicineResult(
    val originalBrand: String,
    val matchedDrug: MasterDrugItem?,
    val matchType: MatchType,
    val confidence: Double,
    val normalizedBrand: String,
    val verifiedSaltComposition: String,
    val normalizedDosage: String,
    val normalizedFrequency: String,
    val normalizedDuration: String,
    val estimatedPrice: Double?
)

object MedicineMatchingEngine {

    fun matchPrescription(extractedMedicines: List<PrescriptionMedicineDto>): List<PrescriptionMedicineDto> {
        return extractedMedicines.map { raw ->
            val match = matchSingleMedicine(raw)
            PrescriptionMedicineDto(
                brandName = match.normalizedBrand,
                saltComposition = match.verifiedSaltComposition,
                dosage = match.normalizedDosage,
                frequency = match.normalizedFrequency,
                duration = match.normalizedDuration
            )
        }
    }

    fun matchSingleMedicine(raw: PrescriptionMedicineDto): MatchedMedicineResult {
        val cleanBrand = cleanName(raw.brandName)
        val cleanGeneric = cleanName(raw.saltComposition)

        // 1. Exact Brand Name Match
        val exactBrand = MedicineMasterCatalog.drugs.firstOrNull {
            it.brandName.equals(cleanBrand, ignoreCase = true) || it.brandName.equals(raw.brandName.trim(), ignoreCase = true)
        }
        if (exactBrand != null) {
            return MatchedMedicineResult(
                originalBrand = raw.brandName,
                matchedDrug = exactBrand,
                matchType = MatchType.EXACT_BRAND,
                confidence = 1.0,
                normalizedBrand = exactBrand.brandName,
                verifiedSaltComposition = exactBrand.saltComposition,
                normalizedDosage = normalizeDosage(raw.dosage, exactBrand.strength),
                normalizedFrequency = normalizeFrequency(raw.frequency),
                normalizedDuration = normalizeDuration(raw.duration),
                estimatedPrice = exactBrand.estimatedPrice
            )
        }

        // 2. Exact Generic Salt Match
        val exactGeneric = MedicineMasterCatalog.drugs.firstOrNull {
            it.saltComposition.equals(cleanGeneric, ignoreCase = true) ||
            it.saltComposition.contains(cleanBrand, ignoreCase = true) ||
            cleanGeneric.contains(it.saltComposition, ignoreCase = true)
        }
        if (exactGeneric != null) {
            return MatchedMedicineResult(
                originalBrand = raw.brandName,
                matchedDrug = exactGeneric,
                matchType = MatchType.EXACT_GENERIC,
                confidence = 0.92,
                normalizedBrand = if (cleanBrand.length >= 3 && !cleanBrand.equals("Generic", ignoreCase = true)) cleanBrand else exactGeneric.brandName,
                verifiedSaltComposition = exactGeneric.saltComposition,
                normalizedDosage = normalizeDosage(raw.dosage, exactGeneric.strength),
                normalizedFrequency = normalizeFrequency(raw.frequency),
                normalizedDuration = normalizeDuration(raw.duration),
                estimatedPrice = exactGeneric.estimatedPrice
            )
        }

        // 3. Fuzzy Brand Match (handles OCR noise: "Napa Extr", "Fex 120", "Monas 10mg", "Losectil20")
        var bestBrandMatch: MasterDrugItem? = null
        var bestBrandScore = 0.0

        for (drug in MedicineMasterCatalog.drugs) {
            val score = max(
                similarityScore(cleanBrand, drug.brandName),
                similarityScore(cleanBrand.split(" ").firstOrNull() ?: "", drug.brandName)
            )
            if (score > bestBrandScore) {
                bestBrandScore = score
                bestBrandMatch = drug
            }
        }

        if (bestBrandMatch != null && bestBrandScore >= 0.45) {
            return MatchedMedicineResult(
                originalBrand = raw.brandName,
                matchedDrug = bestBrandMatch,
                matchType = MatchType.FUZZY_BRAND,
                confidence = bestBrandScore,
                normalizedBrand = bestBrandMatch.brandName,
                verifiedSaltComposition = bestBrandMatch.saltComposition,
                normalizedDosage = normalizeDosage(raw.dosage, bestBrandMatch.strength),
                normalizedFrequency = normalizeFrequency(raw.frequency),
                normalizedDuration = normalizeDuration(raw.duration),
                estimatedPrice = bestBrandMatch.estimatedPrice
            )
        }

        // 4. Fuzzy Generic Match
        var bestGenericMatch: MasterDrugItem? = null
        var bestGenericScore = 0.0

        if (cleanGeneric.length >= 3) {
            for (drug in MedicineMasterCatalog.drugs) {
                val score = max(
                    similarityScore(cleanGeneric, drug.saltComposition),
                    similarityScore(cleanGeneric.split(" ").firstOrNull() ?: "", drug.saltComposition)
                )
                if (score > bestGenericScore) {
                    bestGenericScore = score
                    bestGenericMatch = drug
                }
            }
        }

        if (bestGenericMatch != null && bestGenericScore >= 0.45) {
            return MatchedMedicineResult(
                originalBrand = raw.brandName,
                matchedDrug = bestGenericMatch,
                matchType = MatchType.FUZZY_GENERIC,
                confidence = bestGenericScore,
                normalizedBrand = raw.brandName,
                verifiedSaltComposition = bestGenericMatch.saltComposition,
                normalizedDosage = normalizeDosage(raw.dosage, bestGenericMatch.strength),
                normalizedFrequency = normalizeFrequency(raw.frequency),
                normalizedDuration = normalizeDuration(raw.duration),
                estimatedPrice = bestGenericMatch.estimatedPrice
            )
        }

        // 5. Fallback for uncatalogued custom medicine
        return MatchedMedicineResult(
            originalBrand = raw.brandName,
            matchedDrug = null,
            matchType = MatchType.UNKNOWN,
            confidence = 0.40,
            normalizedBrand = raw.brandName.ifBlank { "Prescribed Medicine" },
            verifiedSaltComposition = raw.saltComposition.ifBlank { "Active Compound" },
            normalizedDosage = normalizeDosage(raw.dosage, "1 tablet"),
            normalizedFrequency = normalizeFrequency(raw.frequency),
            normalizedDuration = normalizeDuration(raw.duration),
            estimatedPrice = null
        )
    }

    private fun cleanName(text: String): String {
        return text.trim()
            .replace(Regex("^(Tab|Cap|Syr|Inj|Tablet|Capsule)\\.?\\s*", RegexOption.IGNORE_CASE), "")
            .replace(Regex("^[0-9]+[.)]\\s*"), "")
            .replace(Regex("\\s+[0-9]+(\\s*(mg|g|mcg|ml|iu|s))?$", RegexOption.IGNORE_CASE), "")
            .trim()
    }

    private fun normalizeFrequency(freq: String): String {
        val f = freq.trim().lowercase()
        return when {
            f.contains("1+0+1") || f.contains("1-0-1") || f.contains("twice") || f.contains("bid") -> "1+0+1"
            f.contains("1+1+1") || f.contains("1-1-1") || f.contains("three") || f.contains("tid") -> "1+1+1"
            f.contains("0+0+1") || f.contains("0-0-1") || f.contains("night") || f.contains("bedtime") -> "0+0+1"
            f.contains("1+0+0") || f.contains("1-0-0") || f.contains("morning") || f.contains("once") -> "1+0+0"
            f.contains("1+1+1+1") || f.contains("qid") || f.contains("four") -> "1+1+1+1"
            freq.isNotBlank() -> freq
            else -> "1+0+1"
        }
    }

    private fun normalizeDosage(dosage: String, fallbackStrength: String): String {
        val d = dosage.trim()
        return when {
            d.isNotBlank() && !d.equals("dosage", ignoreCase = true) -> d
            fallbackStrength.isNotBlank() -> fallbackStrength
            else -> "1 tablet"
        }
    }

    private fun normalizeDuration(duration: String): String {
        val d = duration.trim()
        return when {
            d.isNotBlank() && !d.equals("duration", ignoreCase = true) -> d
            else -> "5 days"
        }
    }

    private fun similarityScore(s1: String, s2: String): Double {
        val a = s1.lowercase().trim()
        val b = s2.lowercase().trim()

        if (a == b) return 1.0
        if (a.isEmpty() || b.isEmpty()) return 0.0
        if (a.contains(b) || b.contains(a)) return 0.85

        val distance = levenshteinDistance(a, b)
        val maxLen = max(a.length, b.length)
        return 1.0 - (distance.toDouble() / maxLen)
    }

    private fun levenshteinDistance(s1: String, s2: String): Int {
        val dp = Array(s1.length + 1) { IntArray(s2.length + 1) }

        for (i in 0..s1.length) dp[i][0] = i
        for (j in 0..s2.length) dp[0][j] = j

        for (i in 1..s1.length) {
            for (j in 1..s2.length) {
                val cost = if (s1[i - 1] == s2[j - 1]) 0 else 1
                dp[i][j] = min(
                    dp[i - 1][j] + 1,
                    min(dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
                )
            }
        }
        return dp[s1.length][s2.length]
    }
}
