package com.medisync.android.presentation.doctor

import com.medisync.android.data.model.EhrRecordDto
import com.medisync.android.data.model.PatientSummaryDto

data class DoctorUiState(
    val isLoading: Boolean = false,
    val patients: List<PatientSummaryDto> = emptyList(),
    val selectedPatient: PatientSummaryDto? = null,
    val isEhrUnlocked: Boolean = false,
    val ehrTimeline: List<EhrRecordDto> = emptyList(),
    val errorMessage: String? = null
)
