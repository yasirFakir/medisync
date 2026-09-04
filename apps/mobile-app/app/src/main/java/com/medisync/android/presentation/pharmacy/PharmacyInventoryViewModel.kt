package com.medisync.android.presentation.pharmacy

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
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

data class InventoryItem(
    val inventoryId: String,
    val drugId: String,
    val drugName: String,
    val manufacturer: String?,
    val quantity: Int,
    val batchNumber: String?,
    val expiryDate: String?,
    val costPrice: Double?,
    val sellingPrice: Double?
)

data class SaleRecord(
    val saleId: String,
    val invoiceNumber: String,
    val customerName: String?,
    val netTotal: Double,
    val profit: Double,
    val paymentMethod: String,
    val createdAt: String,
    val itemCount: Int
)

data class SalesSummary(
    val todayRevenue: Double = 0.0,
    val todayProfit: Double = 0.0,
    val todayOrders: Int = 0,
    val monthRevenue: Double = 0.0,
    val monthProfit: Double = 0.0,
    val monthOrders: Int = 0
)

data class DrugMasterItem(
    val drugId: String,
    val brandName: String,
    val genericName: String,
    val strength: String,
    val manufacturer: String?
)

data class PharmacyInventoryState(
    val inventory: List<InventoryItem> = emptyList(),
    val sales: List<SaleRecord> = emptyList(),
    val summary: SalesSummary = SalesSummary(),
    val drugSearchResults: List<DrugMasterItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class PharmacyInventoryViewModel(
    private val httpClient: HttpClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(PharmacyInventoryState())
    val uiState: StateFlow<PharmacyInventoryState> = _uiState.asStateFlow()

    fun loadInventory() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response: ApiResponse<List<InventoryItem>> = httpClient.get("${NetworkClient.BASE_URL}/pharmacy/inventory").body()
                _uiState.update { it.copy(inventory = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadSales() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val salesResponse: ApiResponse<List<SaleRecord>> = httpClient.get("${NetworkClient.BASE_URL}/pharmacy/sales").body()
                val summaryResponse: ApiResponse<SalesSummary> = httpClient.get("${NetworkClient.BASE_URL}/pharmacy/sales/summary").body()
                _uiState.update { 
                    it.copy(
                        sales = salesResponse.data ?: emptyList(),
                        summary = summaryResponse.data ?: SalesSummary(),
                        isLoading = false
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun searchDrugs(query: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response: ApiResponse<List<DrugMasterItem>> = httpClient.get("${NetworkClient.BASE_URL}/drugs?search=$query").body()
                _uiState.update { it.copy(drugSearchResults = response.data ?: emptyList(), isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun addStock(drugId: String, quantity: Int, batchNumber: String, expiryDate: String, costPrice: Double, sellingPrice: Double, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val bodyMap = mapOf(
                    "drugId" to drugId,
                    "quantity" to quantity,
                    "batchNumber" to batchNumber,
                    "expiryDate" to expiryDate,
                    "costPrice" to costPrice,
                    "sellingPrice" to sellingPrice
                )
                val response: ApiResponse<InventoryItem> = httpClient.post("${NetworkClient.BASE_URL}/pharmacy/inventory") {
                    setBody(bodyMap)
                }.body()
                
                if (response.success) {
                    _uiState.update { it.copy(isLoading = false) }
                    onSuccess()
                } else {
                    val err = response.message ?: response.error ?: "Failed to add stock"
                    _uiState.update { it.copy(isLoading = false, error = err) }
                    onError(err)
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
                onError(e.message ?: "Network error")
            }
        }
    }
}
