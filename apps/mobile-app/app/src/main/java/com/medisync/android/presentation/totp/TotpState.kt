package com.medisync.android.presentation.totp

data class TotpUiState(
    val otpCode: String = "------",
    val secondsRemaining: Int = 30,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
