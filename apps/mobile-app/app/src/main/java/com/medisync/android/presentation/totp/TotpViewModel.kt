package com.medisync.android.presentation.totp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.repository.TotpRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class TotpViewModel(
    private val totpRepository: TotpRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TotpUiState())
    val uiState: StateFlow<TotpUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null

    fun generateNewOtp() {
        timerJob?.cancel()
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = totpRepository.generateOtp()
            result.fold(
                onSuccess = { data ->
                    _uiState.update {
                        it.copy(
                            otpCode = data.otp,
                            secondsRemaining = data.expiresInSeconds,
                            isLoading = false
                        )
                    }
                    startCountdown(data.expiresInSeconds)
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Failed to generate dynamic OTP"
                        )
                    }
                }
            )
        }
    }

    private fun startCountdown(totalSeconds: Int) {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            for (sec in totalSeconds downTo 0) {
                _uiState.update { it.copy(secondsRemaining = sec) }
                if (sec > 0) {
                    delay(1000)
                }
            }
        }
    }

    fun stopTimer() {
        timerJob?.cancel()
    }

    override fun onCleared() {
        super.onCleared()
        stopTimer()
    }
}
