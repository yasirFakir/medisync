package com.medisync.android.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll

data class AdminUser(val userId: String, val fullName: String, val email: String, val role: String, val isActive: Boolean)
data class AdminDrug(val drugId: String, val brandName: String, val genericName: String, val strength: String, val manufacturer: String?, val price: Double?, val saltComposition: String?)
data class AdminTriageLog(val sessionId: String, val patientName: String?, val symptoms: String, val recommendation: String, val createdAt: String)
data class AdminPharmacy(val pharmacyId: String, val storeName: String, val email: String, val city: String, val isVerified: Boolean)
data class AdminStats(val totalUsers: Int, val totalPharmacies: Int, val triageSessions: Int, val totalPrescriptions: Int)
data class AddDrugRequest(val brandName: String, val genericName: String, val saltComposition: String, val strength: String, val manufacturer: String, val price: Double)

data class AdminUiState(
    val stats: AdminStats? = null,
    val users: List<AdminUser> = emptyList(),
    val drugs: List<AdminDrug> = emptyList(),
    val triageLogs: List<AdminTriageLog> = emptyList(),
    val pharmacies: List<AdminPharmacy> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class AdminViewModel(private val httpClient: HttpClient) : ViewModel() {
    private val _uiState = MutableStateFlow(AdminUiState())
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()

    fun loadStats() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                // Fetch in parallel for stats
                val usersDef = async { httpClient.get("${NetworkClient.BASE_URL}/admin/users").body<ApiResponse<List<AdminUser>>>() }
                val pharmDef = async { httpClient.get("${NetworkClient.BASE_URL}/admin/pharmacies").body<ApiResponse<List<AdminPharmacy>>>() }
                val triageDef = async { httpClient.get("${NetworkClient.BASE_URL}/triage/logs").body<ApiResponse<List<AdminTriageLog>>>() }
                
                val users = try { usersDef.await().data ?: emptyList() } catch(e:Exception){ emptyList() }
                val pharmacies = try { pharmDef.await().data ?: emptyList() } catch(e:Exception){ emptyList() }
                val logs = try { triageDef.await().data ?: emptyList() } catch(e:Exception){ emptyList() }
                
                _uiState.update { 
                    it.copy(
                        stats = AdminStats(users.size, pharmacies.size, logs.size, 0), // Prescriptions mocked for now
                        isLoading = false
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadUsers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response: ApiResponse<List<AdminUser>> = httpClient.get("${NetworkClient.BASE_URL}/admin/users").body()
                _uiState.update { it.copy(users = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadDrugs(search: String = "") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val url = if (search.isNotBlank()) "${NetworkClient.BASE_URL}/drugs?search=$search" else "${NetworkClient.BASE_URL}/drugs"
                val response: ApiResponse<List<AdminDrug>> = httpClient.get(url).body()
                _uiState.update { it.copy(drugs = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun addDrug(request: AddDrugRequest, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val response: ApiResponse<AdminDrug> = httpClient.post("${NetworkClient.BASE_URL}/drugs") {
                    setBody(request)
                }.body()
                if (response.success) {
                    onSuccess()
                    loadDrugs()
                } else {
                    onError(response.message ?: response.error ?: "Failed to add drug")
                }
            } catch (e: Exception) {
                onError(e.message ?: "Network error")
            }
        }
    }

    fun loadTriageLogs() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response: ApiResponse<List<AdminTriageLog>> = httpClient.get("${NetworkClient.BASE_URL}/triage/logs").body()
                _uiState.update { it.copy(triageLogs = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadPharmacies() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response: ApiResponse<List<AdminPharmacy>> = httpClient.get("${NetworkClient.BASE_URL}/admin/pharmacies").body()
                _uiState.update { it.copy(pharmacies = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun verifyPharmacy(id: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val response: ApiResponse<AdminPharmacy> = httpClient.patch("${NetworkClient.BASE_URL}/admin/pharmacies/$id/verify").body()
                if (response.success) {
                    onSuccess()
                    loadPharmacies()
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
