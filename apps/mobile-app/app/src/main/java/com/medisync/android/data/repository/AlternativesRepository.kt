package com.medisync.android.data.repository

import com.medisync.android.data.model.AlternativesResponseData
import com.medisync.android.data.model.DrugComparisonDto

interface AlternativesRepository {
    suspend fun getAlternatives(
        drugId: String,
        budget: Double? = null,
        dosageForm: String? = null,
        strength: String? = null
    ): Result<AlternativesResponseData>

    suspend fun compareDrugs(drugIds: List<String>): Result<List<DrugComparisonDto>>
}
