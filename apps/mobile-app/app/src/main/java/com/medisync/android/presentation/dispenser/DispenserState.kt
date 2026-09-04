package com.medisync.android.presentation.dispenser

import com.medisync.android.data.model.DispenseItemDto
import com.medisync.android.data.model.SaleReceiptDto

data class DispenserUiState(
    val isLoading: Boolean = false,
    val patientEmailOrId: String = "patient@medisync.com",
    val otpInput: String = "",
    val isOtpVerified: Boolean = false,
    val itemsToDispense: List<DispenseItemDto> = emptyList(),
    val completedReceipt: SaleReceiptDto? = null,
    val errorMessage: String? = null
)
