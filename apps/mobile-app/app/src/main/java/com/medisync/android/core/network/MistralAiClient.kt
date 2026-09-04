package com.medisync.android.core.network

import android.util.Base64
import com.medisync.android.data.model.ChatMessageDto
import com.medisync.android.data.model.PrescriptionDigitizeData
import com.medisync.android.data.model.TriageResponseData
import com.medisync.android.data.model.UrgencyLevel
import io.ktor.client.HttpClient
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject

class MistralAiClient(
    private val httpClient: HttpClient,
    var apiKey: String = ""
) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val nonMedicalTriggers = listOf(
        "ignore previous", "ignore all", "system prompt", "jailbreak", "dan mode",
        "write code", "write a python", "write javascript", "solve math", "calculate 2+",
        "who is president", "crypto price", "recipe for cake", "tell me a joke", "write essay"
    )

    suspend fun chatTriage(
        sessionId: String?,
        symptoms: List<String>,
        notes: String?,
        history: List<ChatMessageDto>?
    ): Result<TriageResponseData> {
        if (apiKey.isBlank()) {
            return Result.failure(IllegalStateException("Mistral API key is not configured."))
        }

        val userQuery = if (symptoms.isNotEmpty()) {
            "Patient reported: ${symptoms.joinToString(", ")}. Notes/question: ${notes ?: ""}"
        } else {
            notes ?: "Medical inquiry"
        }

        // Client-Side Pre-Filtering Guardrail
        val lowerQuery = userQuery.lowercase()
        if (symptoms.isEmpty() && nonMedicalTriggers.any { lowerQuery.contains(it) }) {
            return Result.success(
                TriageResponseData(
                    sessionId = sessionId ?: "session-${System.currentTimeMillis()}",
                    urgencyLevel = UrgencyLevel.LOW,
                    response = "### 🛡️ MediSync Clinical AI Guardrail\n\nI am **MediSync Clinical AI**, an assistant dedicated exclusively to **medical, medicine, and healthcare guidance**.\n\nI cannot assist with non-health topics, coding, or unrelated queries. Please feel free to ask about any symptoms, medications, or health concerns!",
                    recommendedAction = "Ask a health, symptom, or medicine-related question.",
                    timestamp = "Just now"
                )
            )
        }

        return try {
            val systemPrompt = """
                You are MediSync Clinical AI, a calm, empathetic, and expert clinical triage physician.
                
                CLINICAL COMMUNICATION PRINCIPLES:
                1. REASSURING & NON-PANICKED TONE: Never jump to worst-case conclusions or cause panic. Present common and benign causes first (e.g. mild fever as standard viral immune response; chest discomfort often being acid reflux, gas, or muscle strain).
                2. INTERACTIVE CLINICAL INQUIRY: Ask clarifying questions to better understand the patient's condition (e.g. duration, severity, whether it changes after eating/moving, or if there are other accompanying symptoms).
                3. BALANCED CONTEXT & PROBABLE CAUSES: Provide a clear breakdown of everyday common causes vs things to monitor.
                4. PRACTICAL COMFORT & SAFE OTC: Offer safe home self-care tips (hydration, rest, cooling, OTC like Paracetamol or Antacids when appropriate).
                5. SENSIBLE RED FLAGS: List clear, sensible signs when clinical evaluation is warranted without sounding alarmist.
                
                STRICT GUARDRAILS:
                - Assist ONLY on human health, symptoms, medications, first-aid, and clinical wellness. Refuse any non-health topics politely.
                
                RESPONSE STRUCTURE (Use clean Markdown):
                - **Clinical Overview & Reassurance** (Explain what might be happening calmly)
                - **Clarifying Questions to Consider** (Helpful questions to pinpoint context)
                - **Common Probable Causes** (List typical everyday reasons like viral, reflux, strain)
                - **Safe Home Care & Practical Relief** (Hydration, rest, appropriate supportive steps)
                - **When to Consult a Doctor** (Sensible monitoring signs)
            """.trimIndent()

            val messagesArray = buildJsonArray {
                addJsonObject {
                    put("role", JsonPrimitive("system"))
                    put("content", JsonPrimitive(systemPrompt))
                }
                history?.takeLast(4)?.forEach { msg ->
                    addJsonObject {
                        put("role", JsonPrimitive(if (msg.role == "assistant") "assistant" else "user"))
                        put("content", JsonPrimitive(msg.content))
                    }
                }
                addJsonObject {
                    put("role", JsonPrimitive("user"))
                    put("content", JsonPrimitive(userQuery))
                }
            }

            val requestJson = buildJsonObject {
                put("model", JsonPrimitive("mistral-small-latest"))
                put("messages", messagesArray)
                put("max_tokens", JsonPrimitive(500))
                put("temperature", JsonPrimitive(0.3))
            }

            val httpResponse = httpClient.post("https://api.mistral.ai/v1/chat/completions") {
                header("Authorization", "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(requestJson.toString())
            }

            val responseBodyString = httpResponse.bodyAsText()
            val mistralResponse = json.decodeFromString<MistralChatResponseDto>(responseBodyString)
            val contentText = mistralResponse.choices.firstOrNull()?.message?.content
                ?: return Result.failure(IllegalStateException("No content returned from Mistral AI: $responseBodyString"))

            // Evaluate urgency reasonably
            val textLower = (contentText + " " + symptoms.joinToString(" ") + " " + (notes ?: "")).lowercase()
            val urgency = when {
                (textLower.contains("crushing chest pain") && textLower.contains("left arm")) || textLower.contains("loss of consciousness") -> UrgencyLevel.HIGH
                textLower.contains("high fever") || (textLower.contains("chest pain") && textLower.contains("breath")) -> UrgencyLevel.MEDIUM
                else -> UrgencyLevel.LOW
            }

            val action = when (urgency) {
                UrgencyLevel.CRITICAL -> "Seek emergency medical care immediately."
                UrgencyLevel.HIGH -> "Seek urgent clinical evaluation at a medical facility."
                UrgencyLevel.MEDIUM -> "Rest, monitor symptoms, and consider a routine doctor visit if discomfort continues."
                UrgencyLevel.LOW -> "Maintain hydration, rest, and observe how you feel over the next 24 hours."
            }

            Result.success(
                TriageResponseData(
                    sessionId = sessionId ?: "session-${System.currentTimeMillis()}",
                    urgencyLevel = urgency,
                    response = contentText.trim(),
                    recommendedAction = action,
                    timestamp = "Just now"
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun extractPrescription(imageBytes: ByteArray): Result<PrescriptionDigitizeData> {
        if (apiKey.isBlank()) {
            return Result.failure(IllegalStateException("Mistral API key is not configured."))
        }

        return try {
            val base64Image = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
            val dataUrl = "data:image/jpeg;base64,$base64Image"

            val prompt = """
                Extract all prescription medicines from this image into strict JSON format with this structure:
                {
                  "doctorName": "Doctor name if visible",
                  "digitizedNotes": "Clinical notes or diagnosis",
                  "medicines": [
                    {
                      "brandName": "Trade Name",
                      "saltComposition": "Generic composition",
                      "dosage": "e.g. 500mg or 1 tab",
                      "frequency": "e.g. 1+0+1",
                      "duration": "e.g. 5 days"
                    }
                  ]
                }
            """.trimIndent()

            val messagesArray = buildJsonArray {
                addJsonObject {
                    put("role", JsonPrimitive("user"))
                    put("content", buildJsonArray {
                        addJsonObject {
                            put("type", JsonPrimitive("text"))
                            put("text", JsonPrimitive(prompt))
                        }
                        addJsonObject {
                            put("type", JsonPrimitive("image_url"))
                            put("image_url", JsonPrimitive(dataUrl))
                        }
                    })
                }
            }

            val responseFormatObject = buildJsonObject {
                put("type", JsonPrimitive("json_object"))
            }

            val requestJson = buildJsonObject {
                put("model", JsonPrimitive("pixtral-12b-2409"))
                put("messages", messagesArray)
                put("response_format", responseFormatObject)
                put("max_tokens", JsonPrimitive(600))
                put("temperature", JsonPrimitive(0.1))
            }

            val httpResponse = httpClient.post("https://api.mistral.ai/v1/chat/completions") {
                header("Authorization", "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(requestJson.toString())
            }

            val responseBodyString = httpResponse.bodyAsText()
            val mistralResponse = json.decodeFromString<MistralChatResponseDto>(responseBodyString)
            val contentText = mistralResponse.choices.firstOrNull()?.message?.content
                ?: return Result.failure(IllegalStateException("Empty content from Mistral Vision OCR: $responseBodyString"))

            val cleanJson = contentText.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
            val parsedData = json.decodeFromString<PrescriptionDigitizeData>(cleanJson)
            Result.success(parsedData)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

@Serializable
data class MistralMessageDto(
    val role: String = "assistant",
    val content: String = ""
)

@Serializable
data class MistralChoiceDto(
    val index: Int = 0,
    val message: MistralMessageDto = MistralMessageDto()
)

@Serializable
data class MistralChatResponseDto(
    val id: String = "",
    val choices: List<MistralChoiceDto> = emptyList()
)
