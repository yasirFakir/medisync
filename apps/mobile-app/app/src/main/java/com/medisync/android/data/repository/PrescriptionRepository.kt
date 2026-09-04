package com.medisync.android.data.repository

import com.medisync.android.data.model.CreatePrescriptionRequest
import com.medisync.android.data.model.PrescriptionDigitizeData
import com.medisync.android.data.model.PrescriptionMedicineDto
import com.medisync.android.data.model.PrescriptionRecord

interface PrescriptionRepository {
    suspend fun digitizePrescription(imageBytes: ByteArray, filename: String): Result<PrescriptionDigitizeData>
    suspend fun createPrescription(request: CreatePrescriptionRequest): Result<PrescriptionRecord>
    suspend fun getPrescriptions(): Result<List<PrescriptionRecord>>
    suspend fun getPrescriptionById(id: String): Result<PrescriptionRecord>
    suspend fun deletePrescription(id: String): Result<Boolean>
}
