package com.medisync.android.presentation.alternatives

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.repository.AlternativesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AlternativesViewModel(
    private val alternativesRepository: AlternativesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AlternativesUiState())
    val uiState: StateFlow<AlternativesUiState> = _uiState.asStateFlow()

    fun loadAlternatives(drugId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = alternativesRepository.getAlternatives(drugId)
            result.fold(
                onSuccess = { data ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            sourceDrug = data.sourceDrug,
                            alternatives = data.alternatives,
                            errorMessage = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Failed to find generic alternatives"
                        )
                    }
                }
            )
        }
    }

    fun toggleSelectionForComparison(drugId: String) {
        _uiState.update { current ->
            val updated = current.selectedForComparison.toMutableSet()
            if (updated.contains(drugId)) {
                updated.remove(drugId)
            } else {
                if (updated.size < 5) {
                    updated.add(drugId)
                }
            }
            current.copy(selectedForComparison = updated)
        }
    }

    fun compareSelected() {
        val selected = _uiState.value.selectedForComparison.toList()
        if (selected.size < 2) return

        viewModelScope.launch {
            _uiState.update { it.copy(isComparing = true) }
            val result = alternativesRepository.compareDrugs(selected)
            result.fold(
                onSuccess = { comparison ->
                    _uiState.update { it.copy(comparisonResult = comparison, isComparing = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isComparing = false) }
                }
            )
        }
    }

    fun clearComparison() {
        _uiState.update { it.copy(comparisonResult = emptyList(), selectedForComparison = emptySet()) }
    }
}
