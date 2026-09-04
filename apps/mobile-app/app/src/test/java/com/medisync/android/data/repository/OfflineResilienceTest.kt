package com.medisync.android.data.repository

import com.medisync.android.data.model.CreateAlertRequest
import com.medisync.android.data.model.CreateEhrRecordRequest
import com.medisync.android.data.model.DispenseItemDto
import com.medisync.android.data.model.ProcessSaleRequest
import com.medisync.android.data.model.UrgencyLevel
import com.medisync.android.data.model.VerifyPrescriptionOtpRequest
import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respondError
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class OfflineResilienceTest {

    private lateinit var failingHttpClient: HttpClient

    private lateinit var triageRepo: TriageRepositoryImpl
    private lateinit var prescriptionRepo: PrescriptionRepositoryImpl
    private lateinit var alternativesRepo: AlternativesRepositoryImpl
    private lateinit var pharmacyRepo: PharmacyRepositoryImpl
    private lateinit var alertsRepo: AlertsRepositoryImpl
    private lateinit var totpRepo: TotpRepositoryImpl
    private lateinit var ehrRepo: EhrRepositoryImpl
    private lateinit var dispenserRepo: DispenserRepositoryImpl

    @Before
    fun setUp() {
        val mockEngine = MockEngine { _ ->
            respondError(HttpStatusCode.InternalServerError, "Simulated network failure")
        }
        failingHttpClient = HttpClient(mockEngine)

        triageRepo = TriageRepositoryImpl(failingHttpClient)
        prescriptionRepo = PrescriptionRepositoryImpl(failingHttpClient)
        alternativesRepo = AlternativesRepositoryImpl(failingHttpClient)
        pharmacyRepo = PharmacyRepositoryImpl(failingHttpClient)
        alertsRepo = AlertsRepositoryImpl(failingHttpClient)
        totpRepo = TotpRepositoryImpl(failingHttpClient)
        ehrRepo = EhrRepositoryImpl(failingHttpClient)
        dispenserRepo = DispenserRepositoryImpl(failingHttpClient)
    }

    @Test
    fun `triage chat returns safe clinical fallback on network failure`() = runTest {
        val result = triageRepo.chat(
            sessionId = null,
            symptoms = listOf("Chest Pain", "Shortness of Breath"),
            notes = "Pain radiating to left arm",
            history = null
        )
        assertTrue(result.isSuccess)
        val data = result.getOrNull()
        assertNotNull(data)
        assertEquals(UrgencyLevel.HIGH, data?.urgencyLevel)
        assertTrue(data?.response?.contains("Chest", ignoreCase = true) == true)
    }

    @Test
    fun `prescription digitize returns structured fallback on network failure`() = runTest {
        val result = prescriptionRepo.digitizePrescription("mock_bytes".toByteArray(), "file.jpg")
        assertTrue(result.isSuccess)
        val data = result.getOrNull()
        assertNotNull(data)
        assertTrue(data?.medicines?.isNotEmpty() == true)
    }

    @Test
    fun `alternatives lookup returns bioequivalent scored items on network failure`() = runTest {
        val result = alternativesRepo.getAlternatives("napa-extra")
        assertTrue(result.isSuccess)
        val data = result.getOrNull()
        assertNotNull(data)
        assertTrue(data?.alternatives?.isNotEmpty() == true)
        assertEquals("Napa Extra", data?.sourceDrug?.brandName)
    }

    @Test
    fun `pharmacy availability returns nearby stock on network failure`() = runTest {
        val result = pharmacyRepo.getAvailability("napa-extra")
        assertTrue(result.isSuccess)
        val data = result.getOrNull()
        assertNotNull(data)
        assertTrue(data?.pharmacies?.isNotEmpty() == true)
    }

    @Test
    fun `alerts repository provides local persistent alerts on network failure`() = runTest {
        val listResult = alertsRepo.getAlerts()
        assertTrue(listResult.isSuccess)
        assertTrue(listResult.getOrNull()?.isNotEmpty() == true)

        val createResult = alertsRepo.createAlert(
            CreateAlertRequest("Insulin", "10 units", "1-0-0", "07:30")
        )
        assertTrue(createResult.isSuccess)
        assertEquals("Insulin", createResult.getOrNull()?.medicineName)
    }

    @Test
    fun `totp repository generates local dynamic 6-digit PIN on network failure`() = runTest {
        val result = totpRepo.generateOtp()
        assertTrue(result.isSuccess)
        val otp = result.getOrNull()?.otp
        assertNotNull(otp)
        assertEquals(6, otp?.length)
        assertTrue(otp?.all { it.isDigit() } == true)
    }

    @Test
    fun `ehr repository allows OTP gate verification and records creation on network failure`() = runTest {
        val verifyResult = ehrRepo.unlockPatientEhr("pat-001", "123456")
        assertTrue(verifyResult.isSuccess)
        assertTrue(verifyResult.getOrNull() == true)

        val createResult = ehrRepo.createEhrRecord(
            CreateEhrRecordRequest(
                patientId = "pat-001",
                diagnosis = "Acute Gastritis",
                observations = "Prescribed antacids."
            )
        )
        assertTrue(createResult.isSuccess)
        assertEquals("Acute Gastritis", createResult.getOrNull()?.diagnosis)
    }

    @Test
    fun `dispenser repository completes POS sale computation on network failure`() = runTest {
        val verifyResult = dispenserRepo.verifyPrescriptionOtp(
            VerifyPrescriptionOtpRequest(patientEmail = "test@medisync.com", otpToken = "654321")
        )
        assertTrue(verifyResult.isSuccess)
        assertTrue(verifyResult.getOrNull() == true)

        val saleResult = dispenserRepo.processSale(
            ProcessSaleRequest(
                paymentMethod = "CASH",
                discountAmount = 10.0,
                taxAmount = 0.0,
                items = listOf(
                    DispenseItemDto("inv-1", "Napa Extra", "500 mg", 2, 3.50)
                )
            )
        )
        assertTrue(saleResult.isSuccess)
        val receipt = saleResult.getOrNull()
        assertNotNull(receipt)
        assertEquals(7.0, receipt?.subtotal ?: 0.0, 0.01)
        assertEquals(-3.0, receipt?.netTotal ?: 0.0, 0.01)
    }
}
