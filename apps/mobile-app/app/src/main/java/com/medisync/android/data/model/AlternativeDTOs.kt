package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AlternativeMatchDetailsDto(
    val sameActiveIngredient: Boolean = true,
    val sameStrength: Boolean = true,
    val sameDosageForm: Boolean = true,
    val priceDifference: Double = 0.0,
    val priceDifferencePercent: Double = 0.0
)

@Serializable
data class ScoredAlternativeDto(
    val drugId: String,
    val brandName: String,
    val saltComposition: String,
    val strength: String = "",
    val dosageForm: String? = "tablet",
    val manufacturer: String? = null,
    val estimatedPrice: Double = 0.0,
    val isGeneric: Boolean = true,
    val trustRating: Double = 4.8,
    val score: Double = 90.0,
    val matchDetails: AlternativeMatchDetailsDto = AlternativeMatchDetailsDto()
)

@Serializable
data class AlternativesResponseData(
    val sourceDrug: DrugMasterDto,
    val alternatives: List<ScoredAlternativeDto> = emptyList(),
    val totalAlternatives: Int = 0
)

@Serializable
data class DrugComparisonDto(
    val drugId: String,
    val brandName: String,
    val genericName: String,
    val manufacturer: String? = null,
    val strength: String = "",
    val dosageForm: String? = "tablet",
    val estimatedPrice: Double = 0.0,
    val isGeneric: Boolean = false,
    val trustRating: Double = 4.5,
    val uses: String? = null,
    val sideEffects: String? = null,
    val contraindications: String? = null,
    val prescriptionRequired: Boolean = false
)
