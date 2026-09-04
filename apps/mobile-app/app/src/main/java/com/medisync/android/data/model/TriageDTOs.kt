package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class UrgencyLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

@Serializable
data class ChatMessageDto(
    val role: String,
    val content: String,
    val timestamp: String
)

@Serializable
data class TriageRequestDto(
    val patientId: String? = null,
    val sessionId: String? = null,
    val symptoms: List<String>,
    val additionalNotes: String? = null,
    val conversationHistory: List<ChatMessageDto>? = null
)

@Serializable
data class TriageResponseData(
    val sessionId: String,
    val urgencyLevel: UrgencyLevel,
    val response: String,
    val recommendedAction: String,
    val timestamp: String? = null
)

@Serializable
data class TriageSessionSummary(
    val sessionId: String,
    val symptoms: List<String> = emptyList(),
    val urgencyLevel: UrgencyLevel = UrgencyLevel.LOW,
    val recommendedAction: String? = null,
    val createdAt: String? = null
)
