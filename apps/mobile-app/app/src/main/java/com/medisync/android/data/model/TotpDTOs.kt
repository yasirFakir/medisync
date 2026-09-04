package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class TotpGenerateResponseData(
    val otp: String,
    val expiresInSeconds: Int = 30
)

@Serializable
data class TotpVerifyRequest(
    val patientId: String? = null,
    val patientEmail: String? = null,
    val otpToken: String
)

@Serializable
data class TotpVerifyResponse(
    val verified: Boolean,
    val message: String? = null
)
