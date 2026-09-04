package com.medisync.android.data.repository

import com.medisync.android.data.model.AuthResponseData
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole

interface AuthRepository {
    suspend fun login(request: LoginRequest): Result<AuthResponseData>
    suspend fun register(request: RegisterRequest): Result<AuthResponseData>
    fun getCachedUser(): UserProfile?
    fun isLoggedIn(): Boolean
    fun logout()
}
