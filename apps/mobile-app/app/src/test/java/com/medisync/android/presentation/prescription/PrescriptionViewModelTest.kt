package com.medisync.android.presentation.prescription

import app.cash.turbine.test
import com.medisync.android.data.model.CreatePrescriptionRequest
import com.medisync.android.data.model.PrescriptionDigitizeData
import com.medisync.android.data.model.PrescriptionMedicineDto
import com.medisync.android.data.model.PrescriptionRecord
import com.medisync.android.data.repository.PrescriptionRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PrescriptionViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val prescriptionRepository: PrescriptionRepository = mockk(relaxed = true)
    private lateinit var viewModel: PrescriptionViewModel

    private val testDigitizeData = PrescriptionDigitizeData(
        doctorName = "Dr. S. Ali",
        digitizedNotes = "Seasonal allergic rhinitis",
        medicines = listOf(
            PrescriptionMedicineDto(
                brandName = "Fexo 120mg",
                saltComposition = "Fexofenadine 120mg",
                dosage = "1 tablet",
                frequency = "0+0+1",
                duration = "7 days"
            )
        )
    )

    private val testRecord = PrescriptionRecord(
        prescriptionId = "rx-999",
        doctorName = "Dr. S. Ali",
        medicines = testDigitizeData.medicines
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { prescriptionRepository.getPrescriptions() } returns Result.success(listOf(testRecord))
        viewModel = PrescriptionViewModel(prescriptionRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `digitizeImage populates detected medicines and doctor name`() = runTest {
        coEvery { prescriptionRepository.digitizePrescription(any(), any()) } returns Result.success(testDigitizeData)

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.digitizeImage("sample_bytes".toByteArray(), "rx.png")
            testDispatcher.scheduler.advanceUntilIdle()

            val state = expectMostRecentItem()
            assertFalse(state.isUploading)
            assertEquals("Dr. S. Ali", state.doctorName)
            assertEquals(1, state.detectedMedicines.size)
            assertEquals("Fexo 120mg", state.detectedMedicines[0].brandName)
        }
    }

    @Test
    fun `addMedicine and removeMedicine updates detected list`() {
        val newMed = PrescriptionMedicineDto("Napa 500mg", "Paracetamol", "1 tablet", "1+1+1", "3 days")
        viewModel.addMedicine(newMed)
        assertEquals(1, viewModel.uiState.value.detectedMedicines.size)

        viewModel.removeMedicine(0)
        assertTrue(viewModel.uiState.value.detectedMedicines.isEmpty())
    }

    @Test
    fun `savePrescription creates record and notifies success`() = runTest {
        coEvery { prescriptionRepository.createPrescription(any()) } returns Result.success(testRecord)
        viewModel.updateDoctorName("Dr. S. Ali")
        viewModel.addMedicine(testDigitizeData.medicines[0])

        var successCallbackCalled = false
        viewModel.savePrescription {
            successCallbackCalled = true
        }
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(successCallbackCalled)
        assertTrue(viewModel.uiState.value.isSavedSuccess)
    }
}
