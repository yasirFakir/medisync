package com.medisync.android.presentation.alternatives

import app.cash.turbine.test
import com.medisync.android.data.model.AlternativeMatchDetailsDto
import com.medisync.android.data.model.AlternativesResponseData
import com.medisync.android.data.model.DrugComparisonDto
import com.medisync.android.data.model.DrugMasterDto
import com.medisync.android.data.model.ScoredAlternativeDto
import com.medisync.android.data.repository.AlternativesRepository
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
class AlternativesViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val alternativesRepository: AlternativesRepository = mockk(relaxed = true)
    private lateinit var viewModel: AlternativesViewModel

    private val testResponse = AlternativesResponseData(
        sourceDrug = DrugMasterDto(
            drugId = "d-src",
            brandName = "Napa Extra",
            saltComposition = "Paracetamol + Caffeine",
            estimatedPrice = 3.50
        ),
        alternatives = listOf(
            ScoredAlternativeDto(
                drugId = "d-alt-1",
                brandName = "Ace Plus",
                saltComposition = "Paracetamol + Caffeine",
                estimatedPrice = 2.50,
                score = 94.5,
                matchDetails = AlternativeMatchDetailsDto(priceDifferencePercent = -28.5)
            )
        ),
        totalAlternatives = 1
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = AlternativesViewModel(alternativesRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadAlternatives updates state with source drug and ranked list`() = runTest {
        coEvery { alternativesRepository.getAlternatives("d-src") } returns Result.success(testResponse)

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.loadAlternatives("d-src")
            testDispatcher.scheduler.advanceUntilIdle()

            val state = expectMostRecentItem()
            assertFalse(state.isLoading)
            assertEquals("Napa Extra", state.sourceDrug?.brandName)
            assertEquals(1, state.alternatives.size)
            assertEquals(94.5, state.alternatives[0].score, 0.1)
        }
    }

    @Test
    fun `toggleSelectionForComparison manages multi-select set`() {
        viewModel.toggleSelectionForComparison("d-alt-1")
        assertTrue(viewModel.uiState.value.selectedForComparison.contains("d-alt-1"))

        viewModel.toggleSelectionForComparison("d-alt-1")
        assertFalse(viewModel.uiState.value.selectedForComparison.contains("d-alt-1"))
    }
}
