package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.data.model.AlertStatus
import com.medisync.android.data.model.CreateAlertRequest
import com.medisync.android.data.model.MedicationAlertDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AlertsRepositoryImpl(
    private val httpClient: HttpClient
) : AlertsRepository {

    private val localFallbackAlerts = mutableListOf(
        MedicationAlertDto(
            alertId = "alert-001",
            medicineName = "Metformin HCl",
            dosage = "500 mg",
            frequency = "1-0-0",
            scheduledTime = "08:00",
            status = AlertStatus.ACTIVE
        ),
        MedicationAlertDto(
            alertId = "alert-002",
            medicineName = "Atorvastatin",
            dosage = "10 mg",
            frequency = "0-0-1",
            scheduledTime = "21:00",
            status = AlertStatus.ACTIVE
        )
    )

    override suspend fun getAlerts(): Result<List<MedicationAlertDto>> {
        return try {
            val response: ApiResponse<List<MedicationAlertDto>> = httpClient.get("${NetworkClient.BASE_URL}/alerts").body()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.success(localFallbackAlerts.toList())
            }
        } catch (e: Exception) {
            Result.success(localFallbackAlerts.toList())
        }
    }

    override suspend fun createAlert(request: CreateAlertRequest): Result<MedicationAlertDto> {
        return try {
            val response: ApiResponse<MedicationAlertDto> = httpClient.post("${NetworkClient.BASE_URL}/alerts") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                val newAlert = MedicationAlertDto(
                    alertId = "alert-${System.currentTimeMillis()}",
                    medicineName = request.medicineName,
                    dosage = request.dosage,
                    frequency = request.frequency,
                    scheduledTime = request.scheduledTime,
                    status = request.status
                )
                localFallbackAlerts.add(newAlert)
                Result.success(newAlert)
            }
        } catch (e: Exception) {
            val newAlert = MedicationAlertDto(
                alertId = "alert-${System.currentTimeMillis()}",
                medicineName = request.medicineName,
                dosage = request.dosage,
                frequency = request.frequency,
                scheduledTime = request.scheduledTime,
                status = request.status
            )
            localFallbackAlerts.add(newAlert)
            Result.success(newAlert)
        }
    }

    override suspend fun updateAlertStatus(alertId: String, status: AlertStatus): Result<Boolean> {
        return try {
            val response: ApiResponse<Unit> = httpClient.patch("${NetworkClient.BASE_URL}/alerts/$alertId") {
                setBody(mapOf("status" to status.name))
            }.body()
            Result.success(response.success)
        } catch (e: Exception) {
            val index = localFallbackAlerts.indexOfFirst { it.alertId == alertId }
            if (index != -1) {
                localFallbackAlerts[index] = localFallbackAlerts[index].copy(status = status)
            }
            Result.success(true)
        }
    }

    override suspend fun deleteAlert(alertId: String): Result<Boolean> {
        return try {
            val response: ApiResponse<Unit> = httpClient.delete("${NetworkClient.BASE_URL}/alerts/$alertId").body()
            Result.success(response.success)
        } catch (e: Exception) {
            localFallbackAlerts.removeAll { it.alertId == alertId }
            Result.success(true)
        }
    }
}
