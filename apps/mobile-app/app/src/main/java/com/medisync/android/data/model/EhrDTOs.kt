package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class EhrRecordDto(
    val recordId: String,
    val patientId: String,
    val doctorId: String? = null,
    val doctorName: String? = "Dr. Sarah Khan",
    val diagnosis: String,
    val observations: String,
    val followUpDate: String? = null,
    val prescriptionId: String? = null,
    val sessionDate: String = "2026-08-15"
)

@Serializable
data class CreateEhrRecordRequest(
    val patientId: String,
    val diagnosis: String,
    val observations: String,
    val followUpDate: String? = null,
    val prescriptionId: String? = null
)

@Serializable
data class PatientSummaryDto(
    val patientId: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val lastConsultationDate: String? = null,
    val activePrescriptionCount: Int = 0
)
