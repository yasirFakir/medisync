package com.medisync.android.presentation.dispenser

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.DispenseItemDto
import com.medisync.android.data.model.ProcessSaleRequest
import com.medisync.android.data.model.VerifyPrescriptionOtpRequest
import com.medisync.android.data.repository.DispenserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class DispenserViewModel(
    private val dispenserRepository: DispenserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DispenserUiState())
    val uiState: StateFlow<DispenserUiState> = _uiState.asStateFlow()

    fun updatePatientQuery(query: String) {
        _uiState.update { it.copy(patientEmailOrId = query, errorMessage = null) }
    }

    fun updateOtp(otp: String) {
        _uiState.update { it.copy(otpInput = otp, errorMessage = null) }
    }

    fun verifyOtpAndLoadPrescriptions() {
        val current = _uiState.value
        if (current.otpInput.length != 6) {
            _uiState.update { it.copy(errorMessage = "6-digit OTP code is required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val request = VerifyPrescriptionOtpRequest(
                patientEmail = current.patientEmailOrId,
                otpToken = current.otpInput
            )
            val result = dispenserRepository.verifyPrescriptionOtp(request)
            result.fold(
                onSuccess = { verified ->
                    if (verified) {
                        _uiState.update {
                            it.copy(
                                isOtpVerified = true,
                                isLoading = false,
                                itemsToDispense = listOf(
                                    DispenseItemDto(
                                        inventoryId = "inv-101",
                                        medicineName = "Metformin HCl 500mg",
                                        dosageStrength = "500 mg",
                                        quantity = 30,
                                        unitPrice = 4.50,
                                        dosageSchedule = "1+0+0"
                                    ),
                                    DispenseItemDto(
                                        inventoryId = "inv-102",
                                        medicineName = "Atorvastatin 10mg",
                                        dosageStrength = "10 mg",
                                        quantity = 15,
                                        unitPrice = 12.00,
                                        dosageSchedule = "0+0+1"
                                    )
                                )
                            )
                        }
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

    fun finalizeSaleAndDispense(paymentMethod: String) {
        val current = _uiState.value
        if (current.itemsToDispense.isEmpty()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val request = ProcessSaleRequest(
                patientId = "pat-001",
                customerName = current.patientEmailOrId,
                paymentMethod = paymentMethod,
                discountAmount = 5.0,
                taxAmount = 0.0,
                items = current.itemsToDispense
            )
            val result = dispenserRepository.processSale(request)
            result.fold(
                onSuccess = { receipt ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            completedReceipt = receipt
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.message) }
                }
            )
        }
    }

    fun reset() {
        _uiState.update {
            DispenserUiState()
        }
    }
}
