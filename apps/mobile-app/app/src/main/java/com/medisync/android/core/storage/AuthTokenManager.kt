package com.medisync.android.core.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AuthTokenManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "medisync_secure_auth",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val json = Json { ignoreUnknownKeys = true }

    fun saveTokens(accessToken: String, refreshToken: String) {
        sharedPreferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
    }

    fun getAccessToken(): String? = sharedPreferences.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = sharedPreferences.getString(KEY_REFRESH_TOKEN, null)

    fun saveUser(user: UserProfile) {
        val userJson = json.encodeToString(user)
        sharedPreferences.edit()
            .putString(KEY_USER_PROFILE, userJson)
            .apply()
    }

    fun getUser(): UserProfile? {
        val userJson = sharedPreferences.getString(KEY_USER_PROFILE, null) ?: return null
        return try {
            json.decodeFromString<UserProfile>(userJson)
        } catch (e: Exception) {
            null
        }
    }

    fun clear() {
        sharedPreferences.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean = !getAccessToken().isNullOrBlank()

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_PROFILE = "user_profile"
    }
}
