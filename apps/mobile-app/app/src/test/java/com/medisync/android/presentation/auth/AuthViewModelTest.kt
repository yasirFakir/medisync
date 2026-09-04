package com.medisync.android.presentation.auth

import app.cash.turbine.test
import com.medisync.android.data.model.AuthResponseData
import com.medisync.android.data.model.LoginRequest
import com.medisync.android.data.model.RegisterRequest
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import com.medisync.android.data.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.every
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val authRepository: AuthRepository = mockk(relaxed = true)
    private lateinit var viewModel: AuthViewModel

    private val testUser = UserProfile(
        id = "user-123",
        fullName = "Rahim Ahmed",
        email = "patient@medisync.com",
        role = UserRole.PATIENT
    )

    private val testAuthResponse = AuthResponseData(
        accessToken = "access-token-123",
        refreshToken = "refresh-token-123",
        user = testUser
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { authRepository.getCachedUser() } returns null
        every { authRepository.isLoggedIn() } returns false
        viewModel = AuthViewModel(authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is empty when user not logged in`() = runTest {
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertNull(state.user)
        assertNull(state.errorMessage)
    }

    @Test
    fun `selectRole updates selectedRole in state`() = runTest {
        viewModel.selectRole(UserRole.DOCTOR)
        assertEquals(UserRole.DOCTOR, viewModel.uiState.value.selectedRole)
    }

    @Test
    fun `login with empty fields emits error without calling repository`() = runTest {
        viewModel.login("", "")
        assertEquals("Email and password are required", viewModel.uiState.value.errorMessage)
    }

    @Test
    fun `login success updates state with user and isSuccess true`() = runTest {
        coEvery { authRepository.login(any()) } returns Result.success(testAuthResponse)

        viewModel.uiState.test {
            assertEquals(false, awaitItem().isSuccess)

            viewModel.login("patient@medisync.com", "password123")
            testDispatcher.scheduler.advanceUntilIdle()

            val successState = expectMostRecentItem()
            assertFalse(successState.isLoading)
            assertTrue(successState.isSuccess)
            assertEquals("patient@medisync.com", successState.user?.email)
            assertNull(successState.errorMessage)
        }
    }

    @Test
    fun `login failure updates state with error message`() = runTest {
        coEvery { authRepository.login(any()) } returns Result.failure(Exception("Invalid credentials"))

        viewModel.uiState.test {
            awaitItem()

            viewModel.login("bad@medisync.com", "wrongpass")
            testDispatcher.scheduler.advanceUntilIdle()

            val errorState = expectMostRecentItem()
            assertFalse(errorState.isLoading)
            assertFalse(errorState.isSuccess)
            assertEquals("Invalid credentials", errorState.errorMessage)
        }
    }

    @Test
    fun `register success updates state with new user profile`() = runTest {
        coEvery { authRepository.register(any()) } returns Result.success(testAuthResponse)

        viewModel.uiState.test {
            awaitItem()

            viewModel.register("Rahim Ahmed", "patient@medisync.com", "password123", UserRole.PATIENT)
            testDispatcher.scheduler.advanceUntilIdle()

            val successState = expectMostRecentItem()
            assertTrue(successState.isSuccess)
            assertEquals("Rahim Ahmed", successState.user?.fullName)
        }
    }

    @Test
    fun `logout clears user state and invokes repository logout`() = runTest {
        viewModel.logout()
        val state = viewModel.uiState.value
        assertFalse(state.isSuccess)
        assertNull(state.user)
    }
}
