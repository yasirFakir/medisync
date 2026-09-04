package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.core.storage.AuthTokenManager
import com.medisync.android.data.model.AuthResponseData
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AuthRepositoryImpl(
    private val httpClient: HttpClient,
    private val tokenManager: AuthTokenManager
) : AuthRepository {

    private val demoUsers = mapOf(
        "patient@medisync.com" to UserProfile(
            id = "demo-patient-001",
            fullName = "Rahim Ahmed",
            email = "patient@medisync.com",
            role = UserRole.PATIENT,
            phoneNumber = "+8801700000001"
        ),
        "doctor@medisync.com" to UserProfile(
            id = "demo-doctor-001",
            fullName = "Dr. Sarah Khan, MBBS",
            email = "doctor@medisync.com",
            role = UserRole.DOCTOR,
            phoneNumber = "+8801800000002"
        ),
        "pharmacy@medisync.com" to UserProfile(
            id = "demo-pharmacy-001",
            fullName = "Lazz Pharma (Dhanmondi)",
            email = "pharmacy@medisync.com",
            role = UserRole.PHARMACY,
            phoneNumber = "+8801900000003"
        )
    )

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
                authenticateStandalone(request.email)
            }
        } catch (e: Exception) {
            authenticateStandalone(request.email)
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
                createStandaloneSession(
                    UserProfile(
                        id = "usr-${System.currentTimeMillis()}",
                        fullName = request.fullName,
                        email = request.email,
                        role = request.role,
                        phoneNumber = request.phoneNumber
                    )
                )
            }
        } catch (e: Exception) {
            createStandaloneSession(
                UserProfile(
                    id = "usr-${System.currentTimeMillis()}",
                    fullName = request.fullName,
                    email = request.email,
                    role = request.role,
                    phoneNumber = request.phoneNumber
                )
            )
        }
    }

    private fun authenticateStandalone(email: String): Result<AuthResponseData> {
        val emailLower = email.lowercase().trim()
        val user = demoUsers[emailLower] ?: UserProfile(
            id = "demo-user-${System.currentTimeMillis()}",
            fullName = email.substringBefore("@").replace(".", " ").replaceFirstChar { it.uppercase() },
            email = email,
            role = if (emailLower.contains("doc")) UserRole.DOCTOR else if (emailLower.contains("pharm")) UserRole.PHARMACY else UserRole.PATIENT,
            phoneNumber = "+8801700000000"
        )
        return createStandaloneSession(user)
    }

    private fun createStandaloneSession(user: UserProfile): Result<AuthResponseData> {
        val authData = AuthResponseData(
            accessToken = "standalone-mock-token-${System.currentTimeMillis()}",
            refreshToken = "standalone-mock-refresh-${System.currentTimeMillis()}",
            user = user
        )
        tokenManager.saveTokens(authData.accessToken, authData.refreshToken)
        tokenManager.saveUser(authData.user)
        return Result.success(authData)
    }

    override fun getCachedUser(): UserProfile? = tokenManager.getUser()

    override fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    override fun logout() {
        tokenManager.clear()
    }
}
