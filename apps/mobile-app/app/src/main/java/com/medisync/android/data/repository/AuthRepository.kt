package com.medisync.android.data.repository

import com.medisync.android.data.model.AuthResponseData
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UpdateProfileRequest
import com.medisync.android.data.model.UserProfile

interface AuthRepository {
    suspend fun login(request: LoginRequest): Result<AuthResponseData>
    suspend fun register(request: RegisterRequest): Result<AuthResponseData>
    suspend fun getProfile(): Result<UserProfile>
    suspend fun updateProfile(request: UpdateProfileRequest): Result<UserProfile>
    fun getCachedUser(): UserProfile?
    fun isLoggedIn(): Boolean
    fun logout()
}

