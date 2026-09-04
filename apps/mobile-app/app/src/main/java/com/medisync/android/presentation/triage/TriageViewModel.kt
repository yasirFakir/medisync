package com.medisync.android.presentation.triage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.ChatMessageDto
import com.medisync.android.data.model.UrgencyLevel
import com.medisync.android.data.repository.TriageRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class TriageViewModel(
    private val triageRepository: TriageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TriageUiState())
    val uiState: StateFlow<TriageUiState> = _uiState.asStateFlow()

    init {
        loadSessions()
    }

    fun toggleSymptom(symptom: String) {
        _uiState.update { current ->
            val updated = current.selectedSymptoms.toMutableSet()
            if (updated.contains(symptom)) {
                updated.remove(symptom)
            } else {
                updated.add(symptom)
            }
            current.copy(selectedSymptoms = updated)
        }
    }

    fun sendMessage(queryText: String) {
        val current = _uiState.value
        val symptoms = if (current.selectedSymptoms.isNotEmpty()) {
            current.selectedSymptoms.toList()
        } else {
            listOf(queryText.ifBlank { "General Consultation" })
        }

        val userMessage = UiChatMessage(
            role = "user",
            content = queryText.ifBlank { "Symptoms reported: ${symptoms.joinToString(", ")}" }
        )

        val updatedMessages = current.messages + userMessage
        _uiState.update {
            it.copy(
                messages = updatedMessages,
                isLoading = true,
                errorMessage = null
            )
        }

        viewModelScope.launch {
            val history = updatedMessages.map {
                ChatMessageDto(
                    role = it.role,
                    content = it.content,
                    timestamp = it.timestamp
                )
            }

            val result = triageRepository.chat(
                sessionId = current.sessionId,
                symptoms = symptoms,
                notes = queryText,
                history = history
            )

            result.fold(
                onSuccess = { response ->
                    val assistantMessage = UiChatMessage(
                        role = "assistant",
                        content = response.response,
                        urgencyLevel = response.urgencyLevel,
                        recommendedAction = response.recommendedAction
                    )
                    _uiState.update {
                        it.copy(
                            sessionId = response.sessionId,
                            currentUrgency = response.urgencyLevel,
                            messages = it.messages + assistantMessage,
                            isLoading = false
                        )
                    }
                    loadSessions()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Failed to get AI triage evaluation"
                        )
                    }
                }
            )
        }
    }

    fun loadSessions() {
        viewModelScope.launch {
            val result = triageRepository.getSessions()
            result.onSuccess { sessionsList ->
                _uiState.update { it.copy(sessions = sessionsList) }
            }
        }
    }

    fun resetSession() {
        _uiState.update {
            TriageUiState(
                sessions = it.sessions
            )
        }
    }
}
