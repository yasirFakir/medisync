package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class UserRole {
    PATIENT,
    DOCTOR,
    PHARMACY,
    ADMIN
}

@Serializable
data class UserProfile(
    val id: String,
    val fullName: String,
    val email: String,
    val role: UserRole,
    val phoneNumber: String? = null,
    val createdAt: String? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val fullName: String,
    val email: String,
    val password: String,
    val role: UserRole,
    val phoneNumber: String? = null
)

@Serializable
data class AuthResponseData(
    val accessToken: String,
    val refreshToken: String,
    val user: UserProfile
)
