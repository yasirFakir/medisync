package com.medisync.android.presentation.auth

import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole

data class AuthUiState(
    val isLoading: Boolean = false,
    val user: UserProfile? = null,
    val selectedRole: UserRole = UserRole.PATIENT,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)
