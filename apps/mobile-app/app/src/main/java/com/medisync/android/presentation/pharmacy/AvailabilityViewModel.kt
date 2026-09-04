package com.medisync.android.presentation.pharmacy

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.data.model.PrescriptionRecord
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AvailabilityMedicine(val brandName: String, val saltComposition: String)
data class AvailabilityRequest(val medicines: List<AvailabilityMedicine>)

data class AvailabilityPharmacy(
    val id: String,
    val storeName: String,
    val address: String,
    val availabilityPercent: Int,
    val matchScore: Float,
    val matchingDrugs: List<String>,
    val alternativeDrugs: List<String>,
    val missingDrugs: List<String>
)

data class AvailabilityUiState(
    val prescriptions: List<PrescriptionRecord> = emptyList(),
    val selectedMedicines: List<AvailabilityMedicine> = emptyList(),
    val results: List<AvailabilityPharmacy> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class AvailabilityViewModel(private val httpClient: HttpClient) : ViewModel() {
    private val _uiState = MutableStateFlow(AvailabilityUiState())
    val uiState: StateFlow<AvailabilityUiState> = _uiState.asStateFlow()

    fun loadPrescriptions() {
        viewModelScope.launch {
            try {
                val response: ApiResponse<List<PrescriptionRecord>> = httpClient.get("${NetworkClient.BASE_URL}/prescriptions/my").body()
                _uiState.update { it.copy(prescriptions = response.data ?: emptyList()) }
            } catch (e: Exception) {
                // handle error
            }
        }
    }

    fun addMedicine(medicine: AvailabilityMedicine) {
        _uiState.update { it.copy(selectedMedicines = it.selectedMedicines + medicine) }
    }
    
    fun removeMedicine(medicine: AvailabilityMedicine) {
        _uiState.update { it.copy(selectedMedicines = it.selectedMedicines - medicine) }
    }

    fun checkAvailability() {
        if (_uiState.value.selectedMedicines.isEmpty()) return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val req = AvailabilityRequest(_uiState.value.selectedMedicines)
                val response: ApiResponse<List<AvailabilityPharmacy>> = httpClient.post("${NetworkClient.BASE_URL}/pharmacy/availability") {
                    setBody(req)
                }.body()
                _uiState.update { it.copy(results = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}
