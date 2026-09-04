package com.medisync.android.data.repository

import com.medisync.android.data.model.ProcessSaleRequest
import com.medisync.android.data.model.SaleReceiptDto
import com.medisync.android.data.model.VerifyPrescriptionOtpRequest

interface DispenserRepository {
    suspend fun verifyPrescriptionOtp(request: VerifyPrescriptionOtpRequest): Result<Boolean>
    suspend fun processSale(request: ProcessSaleRequest): Result<SaleReceiptDto>
}
