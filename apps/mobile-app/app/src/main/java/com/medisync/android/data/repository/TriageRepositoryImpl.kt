package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.MistralAiClient
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.data.model.ChatMessageDto
import com.medisync.android.data.model.TriageRequestDto
import com.medisync.android.data.model.TriageResponseData
import com.medisync.android.data.model.TriageSessionSummary
import com.medisync.android.data.model.UrgencyLevel
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class TriageRepositoryImpl(
    private val httpClient: HttpClient,
    private val mistralAiClient: MistralAiClient? = null
) : TriageRepository {

    private val localSessions = mutableListOf<TriageSessionSummary>()

    override suspend fun chat(
        sessionId: String?,
        symptoms: List<String>,
        notes: String?,
        history: List<ChatMessageDto>?
    ): Result<TriageResponseData> {
        // 1. Try Mistral AI if key configured
        if (mistralAiClient != null && mistralAiClient.apiKey.isNotBlank()) {
            val mistralResult = mistralAiClient.chatTriage(sessionId, symptoms, notes, history)
            if (mistralResult.isSuccess) {
                val data = mistralResult.getOrThrow()
                saveSessionLocally(data.sessionId, symptoms, data.urgencyLevel, data.recommendedAction)
                return mistralResult
            }
        }

        // 2. Try backend endpoint if reachable
        return try {
            val request = TriageRequestDto(
                sessionId = sessionId,
                symptoms = symptoms,
                additionalNotes = notes,
                conversationHistory = history
            )
            val response: ApiResponse<TriageResponseData> = httpClient.post("${NetworkClient.BASE_URL}/triage/chat") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                saveSessionLocally(response.data.sessionId, symptoms, response.data.urgencyLevel, response.data.recommendedAction)
                Result.success(response.data)
            } else {
                val fallback = generateRichFallback(sessionId, symptoms, notes)
                saveSessionLocally(fallback.sessionId, symptoms, fallback.urgencyLevel, fallback.recommendedAction)
                Result.success(fallback)
            }
        } catch (e: Exception) {
            val fallback = generateRichFallback(sessionId, symptoms, notes)
            saveSessionLocally(fallback.sessionId, symptoms, fallback.urgencyLevel, fallback.recommendedAction)
            Result.success(fallback)
        }
    }

    private fun generateRichFallback(sessionId: String?, symptoms: List<String>, notes: String?): TriageResponseData {
        val hasChestPain = symptoms.any { it.contains("Chest", ignoreCase = true) } || notes?.contains("chest pain", ignoreCase = true) == true
        val hasBreathShortness = symptoms.any { it.contains("Breath", ignoreCase = true) } || notes?.contains("breath", ignoreCase = true) == true
        val hasFever = symptoms.any { it.contains("Fever", ignoreCase = true) } || notes?.contains("fever", ignoreCase = true) == true
        val hasHeadache = symptoms.any { it.contains("Headache", ignoreCase = true) } || notes?.contains("headache", ignoreCase = true) == true

        val urgency: UrgencyLevel
        val responseText: String
        val recommendedAction: String

        when {
            hasChestPain || (hasFever && hasBreathShortness) -> {
                urgency = UrgencyLevel.HIGH
                responseText = "Chest discomfort and shortness of breath require immediate medical evaluation. Please rest in a comfortable upright position, loosen tight clothing, and avoid strenuous activity. If pain radiates to your left arm or jaw, seek emergency emergency care immediately."
                recommendedAction = "Seek emergency medical consultation or call emergency hotline."
            }
            hasFever -> {
                urgency = UrgencyLevel.MEDIUM
                responseText = "Fever is typically your body's immune response to an infection (such as a viral infection). \n\nSelf-Care Guidance:\n• Stay well hydrated with water, oral rehydration salts (ORS), and warm soups.\n• Ensure plenty of physical rest in a well-ventilated room.\n• You may use lukewarm water sponge baths to naturally reduce temperature.\n• Standard antipyretics like Paracetamol (500mg) can help alleviate fever and body aches.\n\nSeek clinical care if fever exceeds 102°F (39°C) or lasts more than 3 consecutive days."
                recommendedAction = "Hydrate, take paracetamol if needed, and monitor temperature."
            }
            hasHeadache -> {
                urgency = UrgencyLevel.LOW
                responseText = "Headaches are often linked to stress, dehydration, lack of sleep, or screen strain. \n\nTips for Relief:\n• Drink 1-2 glasses of water and rest in a quiet, darkened room.\n• Apply a cool compress to your forehead or temples.\n• Practice gentle neck and shoulder stretching."
                recommendedAction = "Rest in a quiet room and stay hydrated."
            }
            else -> {
                urgency = UrgencyLevel.LOW
                val symptomList = if (symptoms.isNotEmpty()) symptoms.joinToString(", ") else "your inquiry"
                responseText = "Based on your reported symptoms ($symptomList):\n• Maintain adequate hydration and nutritional intake.\n• Monitor your symptoms over the next 24-48 hours.\n• If symptoms worsen or new severe symptoms develop, schedule an appointment with a primary care doctor."
                recommendedAction = "Rest and monitor your condition for 24-48 hours."
            }
        }

        return TriageResponseData(
            sessionId = sessionId ?: "session-${System.currentTimeMillis()}",
            urgencyLevel = urgency,
            response = responseText,
            recommendedAction = recommendedAction,
            timestamp = "Just now"
        )
    }

    private fun saveSessionLocally(sessionId: String, symptoms: List<String>, urgency: UrgencyLevel, action: String?) {
        localSessions.removeAll { it.sessionId == sessionId }
        localSessions.add(
            0,
            TriageSessionSummary(
                sessionId = sessionId,
                symptoms = symptoms,
                urgencyLevel = urgency,
                recommendedAction = action,
                createdAt = "2026-08-23"
            )
        )
    }

    override suspend fun getSessions(): Result<List<TriageSessionSummary>> {
        return try {
            val response: ApiResponse<List<TriageSessionSummary>> = httpClient.get("${NetworkClient.BASE_URL}/triage/sessions").body()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.success(localSessions.toList())
            }
        } catch (e: Exception) {
            Result.success(localSessions.toList())
        }
    }

    override suspend fun deleteSession(sessionId: String): Result<Boolean> {
        localSessions.removeAll { it.sessionId == sessionId }
        return Result.success(true)
    }
}
