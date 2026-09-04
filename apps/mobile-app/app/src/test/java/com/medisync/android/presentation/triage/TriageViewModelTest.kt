package com.medisync.android.presentation.triage

import app.cash.turbine.test
import com.medisync.android.data.model.TriageResponseData
import com.medisync.android.data.model.UrgencyLevel
import com.medisync.android.data.repository.TriageRepository
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
class TriageViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val triageRepository: TriageRepository = mockk(relaxed = true)
    private lateinit var viewModel: TriageViewModel

    private val testTriageResponse = TriageResponseData(
        sessionId = "session-triage-1",
        urgencyLevel = UrgencyLevel.HIGH,
        response = "High temperature and headache detected.",
        recommendedAction = "Take paracetamol and visit clinic if fever exceeds 102F."
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { triageRepository.getSessions() } returns Result.success(emptyList())
        viewModel = TriageViewModel(triageRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `toggleSymptom adds and removes symptoms from selection`() {
        viewModel.toggleSymptom("Fever")
        assertTrue(viewModel.uiState.value.selectedSymptoms.contains("Fever"))

        viewModel.toggleSymptom("Fever")
        assertFalse(viewModel.uiState.value.selectedSymptoms.contains("Fever"))
    }

    @Test
    fun `sendMessage updates messages and evaluates urgency`() = runTest {
        coEvery { triageRepository.chat(any(), any(), any(), any()) } returns Result.success(testTriageResponse)

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.toggleSymptom("Fever")
            viewModel.sendMessage("Severe fever since morning")
            testDispatcher.scheduler.advanceUntilIdle()

            val latestState = expectMostRecentItem()
            assertFalse(latestState.isLoading)
            assertEquals(UrgencyLevel.HIGH, latestState.currentUrgency)
            assertEquals("session-triage-1", latestState.sessionId)
            assertTrue(latestState.messages.any { it.role == "assistant" && it.urgencyLevel == UrgencyLevel.HIGH })
        }
    }

    @Test
    fun `resetSession clears active session messages`() {
        viewModel.toggleSymptom("Headache")
        viewModel.resetSession()
        assertTrue(viewModel.uiState.value.selectedSymptoms.isEmpty())
        assertEquals(UrgencyLevel.LOW, viewModel.uiState.value.currentUrgency)
    }
}
