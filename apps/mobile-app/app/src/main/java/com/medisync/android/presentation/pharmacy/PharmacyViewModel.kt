package com.medisync.android.presentation.pharmacy

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.repository.PharmacyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PharmacyViewModel(
    private val pharmacyRepository: PharmacyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PharmacyUiState())
    val uiState: StateFlow<PharmacyUiState> = _uiState.asStateFlow()

    fun searchPharmacies(query: String? = null, city: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = pharmacyRepository.searchPharmacies(query, city)
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(pharmacies = list, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun loadAvailability(drugId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = pharmacyRepository.getAvailability(drugId)
            result.fold(
                onSuccess = { data ->
                    _uiState.update { it.copy(availabilityResult = data, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }
}
