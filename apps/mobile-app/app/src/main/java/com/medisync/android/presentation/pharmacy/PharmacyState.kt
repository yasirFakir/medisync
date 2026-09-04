package com.medisync.android.presentation.pharmacy

import com.medisync.android.data.model.AvailabilityResultDto
import com.medisync.android.data.model.PharmacyDto

data class PharmacyUiState(
    val isLoading: Boolean = false,
    val searchQuery: String = "",
    val cityFilter: String = "Dhaka",
    val pharmacies: List<PharmacyDto> = emptyList(),
    val availabilityResult: AvailabilityResultDto? = null,
    val errorMessage: String? = null
)
