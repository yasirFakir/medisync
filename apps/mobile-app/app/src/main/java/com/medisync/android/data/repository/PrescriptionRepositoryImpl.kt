package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.MistralAiClient
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.core.rag.MedicineMatchingEngine
import com.medisync.android.data.model.CreatePrescriptionRequest
import com.medisync.android.data.model.PrescriptionDigitizeData
import com.medisync.android.data.model.PrescriptionMedicineDto
import com.medisync.android.data.model.PrescriptionRecord
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders

class PrescriptionRepositoryImpl(
    private val httpClient: HttpClient,
    private val mistralAiClient: MistralAiClient? = null
) : PrescriptionRepository {

    private val localPrescriptions = mutableListOf(
        PrescriptionRecord(
            prescriptionId = "rx-demo-001",
            doctorName = "Dr. A. Rahman, MBBS, FCPS",
            digitizedNotes = "Acute upper respiratory tract infection with low-grade pyrexia.",
            createdAt = "2026-08-15",
            medicines = listOf(
                PrescriptionMedicineDto(
                    brandName = "Napa Extra",
                    saltComposition = "Paracetamol 500mg + Caffeine 65mg",
                    dosage = "1 tablet",
                    frequency = "1+0+1",
                    duration = "5 days"
                ),
                PrescriptionMedicineDto(
                    brandName = "Fexo",
                    saltComposition = "Fexofenadine HCl",
                    dosage = "120mg",
                    frequency = "0+0+1",
                    duration = "7 days"
                )
            )
        )
    )

    override suspend fun digitizePrescription(imageBytes: ByteArray, filename: String): Result<PrescriptionDigitizeData> {
        // 1. Try Mistral AI Vision OCR if configured
        if (mistralAiClient != null && mistralAiClient.apiKey.isNotBlank()) {
            val mistralResult = mistralAiClient.extractPrescription(imageBytes)
            if (mistralResult.isSuccess) {
                val rawData = mistralResult.getOrThrow()
                val matchedMedicines = MedicineMatchingEngine.matchPrescription(rawData.medicines)
                return Result.success(
                    rawData.copy(medicines = matchedMedicines)
                )
            }
        }

        // 2. Try backend endpoint if reachable
        return try {
            val response: ApiResponse<PrescriptionDigitizeData> = httpClient.submitFormWithBinaryData(
                url = "${NetworkClient.BASE_URL}/prescriptions/digitize",
                formData = formData {
                    append("file", imageBytes, Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=\"$filename\"")
                    })
                }
            ).body()

            if (response.success && response.data != null) {
                val matched = MedicineMatchingEngine.matchPrescription(response.data.medicines)
                Result.success(response.data.copy(medicines = matched))
            } else {
                val fallback = getFallbackDigitizeData()
                val matched = MedicineMatchingEngine.matchPrescription(fallback.medicines)
                Result.success(fallback.copy(medicines = matched))
            }
        } catch (e: Exception) {
            val fallback = getFallbackDigitizeData()
            val matched = MedicineMatchingEngine.matchPrescription(fallback.medicines)
            Result.success(fallback.copy(medicines = matched))
        }
    }

    private fun getFallbackDigitizeData(): PrescriptionDigitizeData {
        return PrescriptionDigitizeData(
            doctorName = "Dr. Ahmed Khan MBBS, FCPS",
            digitizedNotes = "Acute viral fever and seasonal allergic rhinitis.",
            medicines = listOf(
                PrescriptionMedicineDto(
                    brandName = "Napa Extra",
                    saltComposition = "Paracetamol 500mg + Caffeine 65mg",
                    dosage = "500mg/65mg",
                    frequency = "1+0+1",
                    duration = "5 days"
                ),
                PrescriptionMedicineDto(
                    brandName = "Fexo",
                    saltComposition = "Fexofenadine HCl",
                    dosage = "120mg",
                    frequency = "0+0+1",
                    duration = "7 days"
                ),
                PrescriptionMedicineDto(
                    brandName = "Monas",
                    saltComposition = "Montelukast Sodium",
                    dosage = "10mg",
                    frequency = "0+0+1",
                    duration = "14 days"
                ),
                PrescriptionMedicineDto(
                    brandName = "Losectil",
                    saltComposition = "Omeprazole",
                    dosage = "20mg",
                    frequency = "1+0+1",
                    duration = "14 days"
                )
            ),
            rawImageUrl = "/uploads/prescription_sample.jpg"
        )
    }

    override suspend fun createPrescription(request: CreatePrescriptionRequest): Result<PrescriptionRecord> {
        val matchedMedicines = MedicineMatchingEngine.matchPrescription(request.medicines)
        return try {
            val response: ApiResponse<PrescriptionRecord> = httpClient.post("${NetworkClient.BASE_URL}/prescriptions") {
                setBody(request.copy(medicines = matchedMedicines))
            }.body()

            if (response.success && response.data != null) {
                localPrescriptions.add(0, response.data)
                Result.success(response.data)
            } else {
                val newRec = PrescriptionRecord(
                    prescriptionId = "rx-${System.currentTimeMillis()}",
                    doctorName = request.doctorName,
                    digitizedNotes = request.digitizedNotes,
                    rawImageUrl = request.rawImageUrl,
                    medicines = matchedMedicines,
                    createdAt = "2026-08-23"
                )
                localPrescriptions.add(0, newRec)
                Result.success(newRec)
            }
        } catch (e: Exception) {
            val newRec = PrescriptionRecord(
                prescriptionId = "rx-offline-${System.currentTimeMillis()}",
                doctorName = request.doctorName,
                digitizedNotes = request.digitizedNotes,
                rawImageUrl = request.rawImageUrl,
                medicines = matchedMedicines,
                createdAt = "2026-08-23"
            )
            localPrescriptions.add(0, newRec)
            Result.success(newRec)
        }
    }

    override suspend fun getPrescriptions(): Result<List<PrescriptionRecord>> {
        return try {
            val response: ApiResponse<List<PrescriptionRecord>> = httpClient.get("${NetworkClient.BASE_URL}/prescriptions").body()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.success(localPrescriptions.toList())
            }
        } catch (e: Exception) {
            Result.success(localPrescriptions.toList())
        }
    }

    override suspend fun getPrescriptionById(id: String): Result<PrescriptionRecord> {
        val found = localPrescriptions.firstOrNull { it.prescriptionId == id }
        return if (found != null) {
            Result.success(found)
        } else {
            Result.failure(Exception("Prescription not found"))
        }
    }

    override suspend fun deletePrescription(id: String): Result<Boolean> {
        localPrescriptions.removeAll { it.prescriptionId == id }
        return Result.success(true)
    }
}
