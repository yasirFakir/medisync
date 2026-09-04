package com.medisync.android.data.repository

import com.medisync.android.data.model.AlertStatus
import com.medisync.android.data.model.CreateAlertRequest
import com.medisync.android.data.model.MedicationAlertDto

interface AlertsRepository {
    suspend fun getAlerts(): Result<List<MedicationAlertDto>>
    suspend fun createAlert(request: CreateAlertRequest): Result<MedicationAlertDto>
    suspend fun updateAlertStatus(alertId: String, status: AlertStatus): Result<Boolean>
    suspend fun deleteAlert(alertId: String): Result<Boolean>
}
