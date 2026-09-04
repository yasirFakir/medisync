package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.core.storage.AuthTokenManager
import com.medisync.android.data.model.AuthResponseData
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UpdateProfileRequest
import com.medisync.android.data.model.UserProfile
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AuthRepositoryImpl(
    private val httpClient: HttpClient,
    private val tokenManager: AuthTokenManager
) : AuthRepository {

    override suspend fun login(request: LoginRequest): Result<AuthResponseData> {
        return try {
            val response: ApiResponse<AuthResponseData> = httpClient.post("${NetworkClient.BASE_URL}/auth/login") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                tokenManager.saveTokens(response.data.accessToken, response.data.refreshToken)
                tokenManager.saveUser(response.data.user)
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: response.error ?: "Invalid email or password"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Network error. Unable to reach backend server."))
        }
    }

    override suspend fun register(request: RegisterRequest): Result<AuthResponseData> {
        return try {
            val response: ApiResponse<AuthResponseData> = httpClient.post("${NetworkClient.BASE_URL}/auth/register") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                tokenManager.saveTokens(response.data.accessToken, response.data.refreshToken)
                tokenManager.saveUser(response.data.user)
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: response.error ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Network error. Unable to reach backend server."))
        }
    }

    override suspend fun getProfile(): Result<UserProfile> {
        return try {
            val response: ApiResponse<UserProfile> = httpClient.get("${NetworkClient.BASE_URL}/users/me").body()
            if (response.success && response.data != null) {
                tokenManager.saveUser(response.data)
                Result.success(response.data)
            } else {
                val cached = tokenManager.getUser()
                if (cached != null) Result.success(cached)
                else Result.failure(Exception(response.message ?: "Failed to get user profile"))
            }
        } catch (e: Exception) {
            val cached = tokenManager.getUser()
            if (cached != null) Result.success(cached)
            else Result.failure(Exception(e.message ?: "Network error. Unable to reach backend server."))
        }
    }

    override suspend fun updateProfile(request: UpdateProfileRequest): Result<UserProfile> {
        return try {
            val response: ApiResponse<UserProfile> = httpClient.patch("${NetworkClient.BASE_URL}/users/me") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                tokenManager.saveUser(response.data)
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: response.error ?: "Profile update failed"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Network error updating profile"))
        }
    }

    override fun getCachedUser(): UserProfile? = tokenManager.getUser()

    override fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    override fun logout() {
        tokenManager.clear()
    }
}

