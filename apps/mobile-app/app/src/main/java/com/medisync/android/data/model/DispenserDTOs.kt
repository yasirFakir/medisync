package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class VerifyPrescriptionOtpRequest(
    val patientId: String? = null,
    val patientEmail: String? = null,
    val otpToken: String
)

@Serializable
data class DispenseItemDto(
    val inventoryId: String,
    val medicineName: String,
    val dosageStrength: String = "500 mg",
    val quantity: Int = 1,
    val unitPrice: Double = 3.50,
    val dosageSchedule: String = "1+0+1"
)

@Serializable
data class ProcessSaleRequest(
    val patientId: String? = null,
    val prescriptionId: String? = null,
    val customerName: String? = null,
    val paymentMethod: String = "CASH",
    val discountAmount: Double = 0.0,
    val taxAmount: Double = 0.0,
    val items: List<DispenseItemDto>
)

@Serializable
data class SaleReceiptDto(
    val saleId: String,
    val invoiceNumber: String,
    val subtotal: Double,
    val discountAmount: Double,
    val taxAmount: Double,
    val netTotal: Double,
    val paymentMethod: String,
    val createdAt: String
)
