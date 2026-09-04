package com.medisync.android.presentation.prescription

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.CreatePrescriptionRequest
import com.medisync.android.data.model.PrescriptionMedicineDto
import com.medisync.android.data.repository.PrescriptionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PrescriptionViewModel(
    private val prescriptionRepository: PrescriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PrescriptionUiState())
    val uiState: StateFlow<PrescriptionUiState> = _uiState.asStateFlow()

    init {
        loadPrescriptions()
    }

    fun digitizeImage(imageBytes: ByteArray, filename: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true, errorMessage = null) }
            val result = prescriptionRepository.digitizePrescription(imageBytes, filename)
            result.fold(
                onSuccess = { data ->
                    _uiState.update {
                        it.copy(
                            isUploading = false,
                            doctorName = data.doctorName ?: "Dr. A. Rahman",
                            digitizedNotes = data.digitizedNotes ?: "General consultation notes",
                            detectedMedicines = data.medicines,
                            rawImageUrl = data.rawImageUrl,
                            errorMessage = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isUploading = false,
                            errorMessage = error.message ?: "Failed to digitize prescription"
                        )
                    }
                }
            )
        }
    }

    fun updateDoctorName(name: String) {
        _uiState.update { it.copy(doctorName = name) }
    }

    fun updateNotes(notes: String) {
        _uiState.update { it.copy(digitizedNotes = notes) }
    }

    fun updateMedicine(index: Int, medicine: PrescriptionMedicineDto) {
        _uiState.update { current ->
            val updated = current.detectedMedicines.toMutableList()
            if (index in updated.indices) {
                updated[index] = medicine
            }
            current.copy(detectedMedicines = updated)
        }
    }

    fun addMedicine(medicine: PrescriptionMedicineDto) {
        _uiState.update { it.copy(detectedMedicines = it.detectedMedicines + medicine) }
    }

    fun removeMedicine(index: Int) {
        _uiState.update { current ->
            val updated = current.detectedMedicines.toMutableList()
            if (index in updated.indices) {
                updated.removeAt(index)
            }
            current.copy(detectedMedicines = updated)
        }
    }

    fun savePrescription(onSuccess: () -> Unit) {
        val current = _uiState.value
        if (current.doctorName.isBlank() && current.detectedMedicines.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Prescription details cannot be empty") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val request = CreatePrescriptionRequest(
                doctorName = current.doctorName,
                digitizedNotes = current.digitizedNotes,
                rawImageUrl = current.rawImageUrl,
                medicines = current.detectedMedicines
            )
            val result = prescriptionRepository.createPrescription(request)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isSavedSuccess = true) }
                    loadPrescriptions()
                    onSuccess()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Failed to save prescription"
                        )
                    }
                }
            )
        }
    }

    fun loadPrescriptions() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = prescriptionRepository.getPrescriptions()
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(savedPrescriptions = list, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }
}
