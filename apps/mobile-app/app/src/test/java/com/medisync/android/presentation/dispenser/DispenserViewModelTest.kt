package com.medisync.android.presentation.dispenser

import app.cash.turbine.test
import com.medisync.android.data.model.SaleReceiptDto
import com.medisync.android.data.repository.DispenserRepository
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
class DispenserViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val dispenserRepository: DispenserRepository = mockk(relaxed = true)
    private lateinit var viewModel: DispenserViewModel

    private val testReceipt = SaleReceiptDto(
        saleId = "s-1",
        invoiceNumber = "INV-001",
        subtotal = 100.0,
        discountAmount = 10.0,
        taxAmount = 0.0,
        netTotal = 90.0,
        paymentMethod = "CASH",
        createdAt = "2026-08-15"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = DispenserViewModel(dispenserRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `verifyOtpAndLoadPrescriptions validates 6-digit code and unlocks items`() = runTest {
        coEvery { dispenserRepository.verifyPrescriptionOtp(any()) } returns Result.success(true)

        viewModel.updatePatientQuery("patient@medisync.com")
        viewModel.updateOtp("123456")
        viewModel.verifyOtpAndLoadPrescriptions()
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.isOtpVerified)
        assertTrue(viewModel.uiState.value.itemsToDispense.isNotEmpty())
    }

    @Test
    fun `finalizeSaleAndDispense processes sale and receives receipt`() = runTest {
        coEvery { dispenserRepository.verifyPrescriptionOtp(any()) } returns Result.success(true)
        coEvery { dispenserRepository.processSale(any()) } returns Result.success(testReceipt)

        viewModel.updateOtp("123456")
        viewModel.verifyOtpAndLoadPrescriptions()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.finalizeSaleAndDispense("CASH")
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals("INV-001", viewModel.uiState.value.completedReceipt?.invoiceNumber)
        assertEquals(90.0, viewModel.uiState.value.completedReceipt?.netTotal)
    }
}
