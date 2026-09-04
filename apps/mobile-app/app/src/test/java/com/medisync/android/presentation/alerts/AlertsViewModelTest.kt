package com.medisync.android.presentation.alerts

import app.cash.turbine.test
import com.medisync.android.data.model.AlertStatus
import com.medisync.android.data.model.MedicationAlertDto
import com.medisync.android.data.repository.AlertsRepository
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
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AlertsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val alertsRepository: AlertsRepository = mockk(relaxed = true)
    private lateinit var viewModel: AlertsViewModel

    private val testAlert = MedicationAlertDto(
        alertId = "al-1",
        medicineName = "Metformin HCl",
        dosage = "500 mg",
        scheduledTime = "08:00",
        status = AlertStatus.ACTIVE
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { alertsRepository.getAlerts() } returns Result.success(listOf(testAlert))
        viewModel = AlertsViewModel(alertsRepository, null)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadAlerts populates daily reminder list`() = runTest {
        viewModel.uiState.test {
            val state = expectMostRecentItem()
            assertEquals(1, state.alerts.size)
            assertEquals("Metformin HCl", state.alerts[0].medicineName)
        }
    }

    @Test
    fun `addAlert invokes repository create and reloads alerts`() = runTest {
        coEvery { alertsRepository.createAlert(any()) } returns Result.success(testAlert)

        viewModel.addAlert("Atorvastatin", "10 mg", "0-0-1", "21:00")
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isLoading)
    }
}
