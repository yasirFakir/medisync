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
    val address: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val bloodGroup: String? = null,
    val emergencyContact: String? = null,
    val avatarUrl: String? = null,
    val designation: String? = null,
    val specialty: String? = null,
    val degrees: String? = null,
    val area: String? = null,
    val city: String? = null,
    val experienceYears: Int? = null,
    val consultationFee: Double? = null,
    val bio: String? = null,
    val storeName: String? = null,
    val streetAddress: String? = null,
    val pharmacyCity: String? = null,
    val licenseNumber: String? = null,
    val isVerified: Boolean? = null,
    val createdAt: String? = null
)

@Serializable
data class UpdateProfileRequest(
    val fullName: String? = null,
    val phoneNumber: String? = null,
    val address: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val bloodGroup: String? = null,
    val emergencyContact: String? = null,
    val avatarUrl: String? = null,
    val designation: String? = null,
    val specialty: String? = null,
    val degrees: String? = null,
    val area: String? = null,
    val city: String? = null,
    val experienceYears: Int? = null,
    val consultationFee: Double? = null,
    val bio: String? = null,
    val storeName: String? = null,
    val streetAddress: String? = null,
    val pharmacyCity: String? = null
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
