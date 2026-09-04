package com.medisync.android.data.repository

import com.medisync.android.data.model.ChatMessageDto
import com.medisync.android.data.model.TriageResponseData
import com.medisync.android.data.model.TriageSessionSummary

interface TriageRepository {
    suspend fun chat(
        sessionId: String?,
        symptoms: List<String>,
        notes: String?,
        history: List<ChatMessageDto>?
    ): Result<TriageResponseData>

    suspend fun getSessions(): Result<List<TriageSessionSummary>>
    suspend fun deleteSession(sessionId: String): Result<Boolean>
}
