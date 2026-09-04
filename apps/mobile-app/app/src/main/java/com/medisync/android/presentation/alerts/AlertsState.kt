package com.medisync.android.presentation.alerts

import com.medisync.android.data.model.MedicationAlertDto

data class AlertsUiState(
    val isLoading: Boolean = false,
    val alerts: List<MedicationAlertDto> = emptyList(),
    val errorMessage: String? = null,
    val isCreatedSuccess: Boolean = false
)
