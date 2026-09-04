package com.medisync.android.presentation.prescription

import com.medisync.android.data.model.PrescriptionMedicineDto
import com.medisync.android.data.model.PrescriptionRecord

data class PrescriptionUiState(
    val isLoading: Boolean = false,
    val isUploading: Boolean = false,
    val doctorName: String = "",
    val digitizedNotes: String = "",
    val detectedMedicines: List<PrescriptionMedicineDto> = emptyList(),
    val savedPrescriptions: List<PrescriptionRecord> = emptyList(),
    val rawImageUrl: String? = null,
    val errorMessage: String? = null,
    val isSavedSuccess: Boolean = false
)
