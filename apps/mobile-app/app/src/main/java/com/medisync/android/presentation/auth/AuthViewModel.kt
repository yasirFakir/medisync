package com.medisync.android.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UserRole
import com.medisync.android.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        AuthUiState(
            user = authRepository.getCachedUser(),
            isSuccess = authRepository.isLoggedIn()
        )
    )
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun selectRole(role: UserRole) {
        _uiState.update { it.copy(selectedRole = role, errorMessage = null) }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email and password are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = authRepository.login(LoginRequest(email.trim(), password))
            result.fold(
                onSuccess = { authData ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            user = authData.user,
                            selectedRole = authData.user.role,
                            isSuccess = true,
                            errorMessage = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Authentication failed"
                        )
                    }
                }
            )
        }
    }

    fun register(name: String, email: String, password: String, role: UserRole, phone: String? = null) {
        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(errorMessage = "All fields are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val request = RegisterRequest(
                fullName = name.trim(),
                email = email.trim(),
                password = password,
                role = role,
                phoneNumber = phone?.trim()
            )
            val result = authRepository.register(request)
            result.fold(
                onSuccess = { authData ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            user = authData.user,
                            selectedRole = authData.user.role,
                            isSuccess = true,
                            errorMessage = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Registration failed"
                        )
                    }
                }
            )
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun logout() {
        authRepository.logout()
        _uiState.update {
            AuthUiState(
                user = null,
                isSuccess = false,
                errorMessage = null
            )
        }
    }
}
