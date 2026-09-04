package com.medisync.android.data.repository

import com.medisync.android.core.storage.AuthTokenManager
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AuthRepositoryTest {

    private val tokenManager: AuthTokenManager = mockk(relaxed = true)
    private lateinit var authRepository: AuthRepository

    private val testUser = UserProfile(
        id = "user-abc",
        fullName = "Dr. Khan",
        email = "dr.khan@medisync.com",
        role = UserRole.DOCTOR
    )

    @Before
    fun setUp() {
        authRepository = AuthRepositoryImpl(mockk(relaxed = true), tokenManager)
    }

    @Test
    fun `getCachedUser delegates to tokenManager`() {
        every { tokenManager.getUser() } returns testUser
        val result = authRepository.getCachedUser()
        assertEquals("Dr. Khan", result?.fullName)
        assertEquals(UserRole.DOCTOR, result?.role)
    }

    @Test
    fun `isLoggedIn returns true when tokenManager has token`() {
        every { tokenManager.isLoggedIn() } returns true
        assertTrue(authRepository.isLoggedIn())
    }

    @Test
    fun `isLoggedIn returns false when tokenManager has no token`() {
        every { tokenManager.isLoggedIn() } returns false
        assertFalse(authRepository.isLoggedIn())
    }

    @Test
    fun `logout clears tokenManager`() {
        authRepository.logout()
        verify { tokenManager.clear() }
    }
}
