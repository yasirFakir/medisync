package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PrescriptionMedicineDto(
    val brandName: String,
    val saltComposition: String = "",
    val dosage: String = "1 tablet",
    val frequency: String = "1+0+1",
    val duration: String = "5 days"
)

@Serializable
data class PrescriptionDigitizeData(
    val doctorName: String? = null,
    val medicines: List<PrescriptionMedicineDto> = emptyList(),
    val rawImageUrl: String? = null,
    val digitizedNotes: String? = null
)

@Serializable
data class PrescriptionRecord(
    val prescriptionId: String,
    val patientId: String? = null,
    val doctorName: String? = null,
    val rawImageUrl: String? = null,
    val digitizedNotes: String? = null,
    val createdAt: String? = null,
    val medicines: List<PrescriptionMedicineDto> = emptyList()
)

@Serializable
data class CreatePrescriptionRequest(
    val doctorName: String,
    val rawImageUrl: String? = null,
    val digitizedNotes: String? = null,
    val medicines: List<PrescriptionMedicineDto>
)
