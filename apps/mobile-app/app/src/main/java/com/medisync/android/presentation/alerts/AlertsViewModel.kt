package com.medisync.android.presentation.alerts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.core.alarms.MedicationAlarmScheduler
import com.medisync.android.data.model.AlertStatus
import com.medisync.android.data.model.CreateAlertRequest
import com.medisync.android.data.model.MedicationAlertDto
import com.medisync.android.data.repository.AlertsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AlertsViewModel(
    private val alertsRepository: AlertsRepository,
    private val alarmScheduler: MedicationAlarmScheduler? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(AlertsUiState())
    val uiState: StateFlow<AlertsUiState> = _uiState.asStateFlow()

    init {
        loadAlerts()
    }

    fun loadAlerts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = alertsRepository.getAlerts()
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(alerts = list, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun addAlert(medicine: String, dosage: String, frequency: String, time: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val request = CreateAlertRequest(
                medicineName = medicine,
                dosage = dosage,
                frequency = frequency,
                scheduledTime = time,
                status = AlertStatus.ACTIVE
            )
            val result = alertsRepository.createAlert(request)
            result.fold(
                onSuccess = { created ->
                    alarmScheduler?.schedule(created)
                    loadAlerts()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Failed to create reminder"
                        )
                    }
                }
            )
        }
    }

    fun toggleAlertStatus(alert: MedicationAlertDto) {
        val newStatus = if (alert.status == AlertStatus.ACTIVE) AlertStatus.SUSPENDED else AlertStatus.ACTIVE
        viewModelScope.launch {
            alertsRepository.updateAlertStatus(alert.alertId, newStatus)
            if (newStatus == AlertStatus.ACTIVE) {
                alarmScheduler?.schedule(alert.copy(status = newStatus))
            } else {
                alarmScheduler?.cancel(alert)
            }
            loadAlerts()
        }
    }

    fun deleteAlert(alert: MedicationAlertDto) {
        viewModelScope.launch {
            alertsRepository.deleteAlert(alert.alertId)
            alarmScheduler?.cancel(alert)
            loadAlerts()
        }
    }
}
