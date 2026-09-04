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

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class DoctorViewModel(
    private val ehrRepository: EhrRepository,
    private val httpClient: HttpClient
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
                isEhrUnlocked = true,
                ehrTimeline = emptyList(),
                errorMessage = null
            )
        }
        loadTimeline(patient.patientId)
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

    fun loadSessions() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val response: com.medisync.android.core.network.ApiResponse<List<ClinicalSession>> = httpClient.get("${com.medisync.android.core.network.NetworkClient.BASE_URL}/ehr/records/my-sessions").body()
                _uiState.update { it.copy(sessions = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun addSession(patientId: String, diagnosis: String, observations: String, followUpDate: String?, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val bodyMap = mapOf(
                    "patientId" to patientId,
                    "diagnosis" to diagnosis,
                    "observations" to observations,
                    "followUpDate" to followUpDate
                )
                val response: com.medisync.android.core.network.ApiResponse<ClinicalSession> = httpClient.post("${com.medisync.android.core.network.NetworkClient.BASE_URL}/ehr/records") {
                    setBody(bodyMap)
                }.body()
                if (response.success) {
                    _uiState.update { it.copy(isLoading = false) }
                    onSuccess()
                } else {
                    val err = response.message ?: response.error ?: "Failed to add session"
                    _uiState.update { it.copy(isLoading = false, errorMessage = err) }
                    onError(err)
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
                onError(e.message ?: "Network error")
            }
        }
    }
}
