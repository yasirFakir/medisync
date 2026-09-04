package com.medisync.android.presentation.triage

import com.medisync.android.data.model.ChatMessageDto
import com.medisync.android.data.model.TriageSessionSummary
import com.medisync.android.data.model.UrgencyLevel

data class UiChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val role: String, // "user" or "assistant"
    val content: String,
    val urgencyLevel: UrgencyLevel? = null,
    val recommendedAction: String? = null,
    val timestamp: String = "Just now"
)

data class TriageUiState(
    val sessionId: String? = null,
    val selectedSymptoms: Set<String> = emptySet(),
    val messages: List<UiChatMessage> = listOf(
        UiChatMessage(
            role = "assistant",
            content = "Hello! I am your MediSync Clinical AI Assistant. Please select or describe your symptoms below to evaluate urgency and precautions.",
            urgencyLevel = UrgencyLevel.LOW
        )
    ),
    val sessions: List<TriageSessionSummary> = emptyList(),
    val currentUrgency: UrgencyLevel = UrgencyLevel.LOW,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
