package com.medisync.android.core.notifications

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class NotificationStore(private val context: Context) {

    private val _notifications = MutableStateFlow<List<AppNotification>>(
        listOf(
            AppNotification(
                id = "n-seed-1",
                title = "Prescription Digitized & Verified",
                message = "Your prescription from Dr. Ahmed Khan was matched with 4 medicines in the Master Catalog.",
                type = NotificationType.PRESCRIPTION_VERIFIED,
                timestamp = "10 mins ago",
                isRead = false
            ),
            AppNotification(
                id = "n-seed-2",
                title = "Medication Reminder Scheduled",
                message = "Daily dose for Napa Extra (500mg/65mg) set for 08:00 AM & 08:00 PM.",
                type = NotificationType.MEDICATION_ALERT,
                timestamp = "1 hour ago",
                isRead = false
            ),
            AppNotification(
                id = "n-seed-3",
                title = "Dynamic Access Code Generated",
                message = "A 6-digit TOTP security code was generated for doctor timeline access.",
                type = NotificationType.SECURITY_TOTP,
                timestamp = "Yesterday",
                isRead = true
            )
        )
    )
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(2)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    fun postNotification(
        title: String,
        message: String,
        type: NotificationType,
        showSystemNotification: Boolean = true
    ) {
        val newNotification = AppNotification(
            title = title,
            message = message,
            type = type,
            timestamp = "Just now",
            isRead = false
        )

        _notifications.update { current ->
            listOf(newNotification) + current
        }
        updateUnreadCount()

        if (showSystemNotification) {
            try {
                NotificationHelper.showSystemNotification(context, title, message, type)
            } catch (e: Exception) {
                // Ignore system notification errors in unit test mock environments
            }
        }
    }

    fun markAsRead(notificationId: String) {
        _notifications.update { current ->
            current.map {
                if (it.id == notificationId) it.copy(isRead = true) else it
            }
        }
        updateUnreadCount()
    }

    fun markAllAsRead() {
        _notifications.update { current ->
            current.map { it.copy(isRead = true) }
        }
        updateUnreadCount()
    }

    fun clearAll() {
        _notifications.value = emptyList()
        _unreadCount.value = 0
    }

    private fun updateUnreadCount() {
        _unreadCount.value = _notifications.value.count { !it.isRead }
    }
}
