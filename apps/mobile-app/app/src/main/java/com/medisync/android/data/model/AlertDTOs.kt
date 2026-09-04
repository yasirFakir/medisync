package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class AlertStatus {
    ACTIVE,
    SUSPENDED,
    ARCHIVED
}

@Serializable
data class MedicationAlertDto(
    val alertId: String,
    val patientId: String? = null,
    val medicineName: String,
    val dosage: String = "1 tablet",
    val frequency: String = "1-0-1",
    val scheduledTime: String = "08:00", // HH:mm
    val status: AlertStatus = AlertStatus.ACTIVE,
    val createdAt: String? = null
)

@Serializable
data class CreateAlertRequest(
    val medicineName: String,
    val dosage: String = "1 tablet",
    val frequency: String = "1-0-1",
    val scheduledTime: String = "08:00",
    val status: AlertStatus = AlertStatus.ACTIVE
)
