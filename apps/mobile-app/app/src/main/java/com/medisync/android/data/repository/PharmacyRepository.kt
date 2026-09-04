package com.medisync.android.data.repository

import com.medisync.android.data.model.AvailabilityResultDto
import com.medisync.android.data.model.PharmacyDto

interface PharmacyRepository {
    suspend fun getAvailability(drugId: String): Result<AvailabilityResultDto>
    suspend fun searchPharmacies(query: String?, city: String?): Result<List<PharmacyDto>>
}
