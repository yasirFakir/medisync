package com.medisync.android.presentation.doctor

import app.cash.turbine.test
import com.medisync.android.data.model.EhrRecordDto
import com.medisync.android.data.model.PatientSummaryDto
import com.medisync.android.data.repository.EhrRepository
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
class DoctorViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val ehrRepository: EhrRepository = mockk(relaxed = true)
    private lateinit var viewModel: DoctorViewModel

    private val testPatient = PatientSummaryDto(
        patientId = "pat-1",
        fullName = "Rahim Ahmed",
        email = "rahim@example.com"
    )

    private val testRecord = EhrRecordDto(
        recordId = "rec-1",
        patientId = "pat-1",
        diagnosis = "Hypertension Stage 1",
        observations = "Blood pressure 140/90."
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { ehrRepository.getPatients() } returns Result.success(listOf(testPatient))
        viewModel = DoctorViewModel(ehrRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadPatients populates patient list in state`() = runTest {
        viewModel.uiState.test {
            val state = expectMostRecentItem()
            assertEquals(1, state.patients.size)
            assertEquals("Rahim Ahmed", state.patients[0].fullName)
        }
    }

    @Test
    fun `unlockEhrWithOtp verifies code and loads patient timeline`() = runTest {
        coEvery { ehrRepository.unlockPatientEhr("pat-1", "123456") } returns Result.success(true)
        coEvery { ehrRepository.getPatientTimeline("pat-1") } returns Result.success(listOf(testRecord))

        viewModel.selectPatient(testPatient)

        var callbackTriggered = false
        viewModel.unlockEhrWithOtp("123456") {
            callbackTriggered = true
        }
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(callbackTriggered)
        assertTrue(viewModel.uiState.value.isEhrUnlocked)
        assertEquals(1, viewModel.uiState.value.ehrTimeline.size)
        assertEquals("Hypertension Stage 1", viewModel.uiState.value.ehrTimeline[0].diagnosis)
    }
}
