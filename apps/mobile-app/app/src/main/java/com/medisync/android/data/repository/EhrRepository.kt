package com.medisync.android.data.repository

import com.medisync.android.data.model.CreateEhrRecordRequest
import com.medisync.android.data.model.EhrRecordDto
import com.medisync.android.data.model.PatientSummaryDto

interface EhrRepository {
    suspend fun getPatients(): Result<List<PatientSummaryDto>>
    suspend fun unlockPatientEhr(patientId: String, otpToken: String): Result<Boolean>
    suspend fun getPatientTimeline(patientId: String): Result<List<EhrRecordDto>>
    suspend fun createEhrRecord(request: CreateEhrRecordRequest): Result<EhrRecordDto>
}
