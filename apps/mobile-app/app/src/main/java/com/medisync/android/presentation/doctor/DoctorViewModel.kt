package com.medisync.android.presentation.doctor

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.CreateEhrRecordRequest
import com.medisync.android.data.model.PatientSummaryDto
import com.medisync.android.data.repository.EhrRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class DoctorViewModel(
    private val ehrRepository: EhrRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DoctorUiState())
    val uiState: StateFlow<DoctorUiState> = _uiState.asStateFlow()

    init {
        loadPatients()
    }

    fun loadPatients() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = ehrRepository.getPatients()
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(patients = list, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun selectPatient(patient: PatientSummaryDto) {
        _uiState.update {
            it.copy(
                selectedPatient = patient,
                isEhrUnlocked = false,
                ehrTimeline = emptyList(),
                errorMessage = null
            )
        }
    }

    fun unlockEhrWithOtp(otp: String, onSuccess: () -> Unit) {
        val patientId = _uiState.value.selectedPatient?.patientId ?: return
        if (otp.length != 6) {
            _uiState.update { it.copy(errorMessage = "6-digit OTP code required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = ehrRepository.unlockPatientEhr(patientId, otp)
            result.fold(
                onSuccess = { unlocked ->
                    if (unlocked) {
                        _uiState.update { it.copy(isEhrUnlocked = true, isLoading = false) }
                        loadTimeline(patientId)
                        onSuccess()
                    } else {
                        _uiState.update { it.copy(isLoading = false, errorMessage = "Invalid or expired patient OTP") }
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.message ?: "Verification failed") }
                }
            )
        }
    }

    fun loadTimeline(patientId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = ehrRepository.getPatientTimeline(patientId)
            result.fold(
                onSuccess = { timeline ->
                    _uiState.update { it.copy(ehrTimeline = timeline, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun addClinicalRecord(diagnosis: String, observations: String, followUp: String? = null) {
        val patientId = _uiState.value.selectedPatient?.patientId ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val request = CreateEhrRecordRequest(
                patientId = patientId,
                diagnosis = diagnosis,
                observations = observations,
                followUpDate = followUp
            )
            val result = ehrRepository.createEhrRecord(request)
            result.onSuccess {
                loadTimeline(patientId)
            }
        }
    }
}
