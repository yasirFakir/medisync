package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class DrugMasterDto(
    val drugId: String,
    val brandName: String,
    val saltComposition: String,
    val strength: String = "",
    val dosageForm: String? = "tablet",
    val manufacturer: String? = null,
    val estimatedPrice: Double = 0.0,
    val isGeneric: Boolean = false,
    val trustRating: Double = 4.5,
    val uses: String? = null,
    val sideEffects: String? = null,
    val contraindications: String? = null,
    val prescriptionRequired: Boolean = false
)
