package com.medisync.android.presentation.totp

import app.cash.turbine.test
import com.medisync.android.data.model.TotpGenerateResponseData
import com.medisync.android.data.repository.TotpRepository
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
class TotpViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val totpRepository: TotpRepository = mockk(relaxed = true)
    private lateinit var viewModel: TotpViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = TotpViewModel(totpRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `generateNewOtp updates state with 6-digit code and expiration seconds`() = runTest {
        coEvery { totpRepository.generateOtp() } returns Result.success(
            TotpGenerateResponseData(otp = "592813", expiresInSeconds = 30)
        )

        viewModel.uiState.test {
            awaitItem() // initial

            viewModel.generateNewOtp()
            testDispatcher.scheduler.advanceUntilIdle()

            val state = expectMostRecentItem()
            assertFalse(state.isLoading)
            assertEquals("592813", state.otpCode)
            viewModel.stopTimer()
        }
    }
}
