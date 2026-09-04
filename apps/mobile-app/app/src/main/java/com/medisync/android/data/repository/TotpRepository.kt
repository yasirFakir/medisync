package com.medisync.android.data.repository

import com.medisync.android.data.model.TotpGenerateResponseData
import com.medisync.android.data.model.TotpVerifyRequest
import com.medisync.android.data.model.TotpVerifyResponse

interface TotpRepository {
    suspend fun generateOtp(): Result<TotpGenerateResponseData>
    suspend fun verifyOtp(request: TotpVerifyRequest): Result<TotpVerifyResponse>
}
