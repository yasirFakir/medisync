package com.medisync.android.core.notifications

import kotlinx.serialization.Serializable

@Serializable
enum class NotificationType {
    MEDICATION_ALERT,
    PRESCRIPTION_VERIFIED,
    EHR_RECORD,
    SECURITY_TOTP,
    PHARMACY_POS,
    SYSTEM_ALERT
}

@Serializable
data class AppNotification(
    val id: String = "notif-${System.currentTimeMillis()}-${(100..999).random()}",
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: String = "Just now",
    val isRead: Boolean = false
)
