package com.medisync.android.presentation.pharmacy

import app.cash.turbine.test
import com.medisync.android.data.model.AvailabilityResultDto
import com.medisync.android.data.model.DrugMasterDto
import com.medisync.android.data.model.PharmacyDto
import com.medisync.android.data.repository.PharmacyRepository
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
class PharmacyViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val pharmacyRepository: PharmacyRepository = mockk(relaxed = true)
    private lateinit var viewModel: PharmacyViewModel

    private val testPharmacies = listOf(
        PharmacyDto(pharmacyId = "ph-1", storeName = "Lazz Pharma", isVerified = true)
    )

    private val testAvailability = AvailabilityResultDto(
        drug = DrugMasterDto(drugId = "d-1", brandName = "Napa Extra", saltComposition = "Paracetamol")
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = PharmacyViewModel(pharmacyRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `searchPharmacies updates state with pharmacy directory list`() = runTest {
        coEvery { pharmacyRepository.searchPharmacies(any(), any()) } returns Result.success(testPharmacies)

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.searchPharmacies("Dhanmondi")
            testDispatcher.scheduler.advanceUntilIdle()

            val state = expectMostRecentItem()
            assertFalse(state.isLoading)
            assertEquals(1, state.pharmacies.size)
            assertEquals("Lazz Pharma", state.pharmacies[0].storeName)
        }
    }

    @Test
    fun `loadAvailability updates state with availability result`() = runTest {
        coEvery { pharmacyRepository.getAvailability("d-1") } returns Result.success(testAvailability)

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.loadAvailability("d-1")
            testDispatcher.scheduler.advanceUntilIdle()

            val state = expectMostRecentItem()
            assertFalse(state.isLoading)
            assertEquals("Napa Extra", state.availabilityResult?.drug?.brandName)
        }
    }
}
