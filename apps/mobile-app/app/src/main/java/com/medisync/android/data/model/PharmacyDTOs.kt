package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class StockStatus {
    IN_STOCK,
    LOW_STOCK,
    OUT_OF_STOCK
}

@Serializable
data class PharmacyDto(
    val pharmacyId: String,
    val storeName: String,
    val licenseNumber: String = "",
    val streetAddress: String = "",
    val city: String = "Dhaka",
    val isVerified: Boolean = true,
    val contactPhone: String? = null,
    val contactEmail: String? = null
)

@Serializable
data class PharmacyAvailabilityDto(
    val pharmacyId: String,
    val storeName: String,
    val streetAddress: String,
    val city: String,
    val stockStatus: StockStatus,
    val quantity: Int = 0,
    val currentPrice: Double? = null,
    val lastUpdated: String? = null
)

@Serializable
data class AvailabilitySummaryDto(
    val totalPharmacies: Int = 0,
    val inStock: Int = 0,
    val lowStock: Int = 0,
    val outOfStock: Int = 0,
    val lowestPrice: Double? = null,
    val highestPrice: Double? = null,
    val averagePrice: Double? = null
)

@Serializable
data class AvailabilityResultDto(
    val drug: DrugMasterDto,
    val summary: AvailabilitySummaryDto = AvailabilitySummaryDto(),
    val pharmacies: List<PharmacyAvailabilityDto> = emptyList()
)
