package com.medisync.android.presentation.notifications

import androidx.lifecycle.ViewModel
import com.medisync.android.core.notifications.AppNotification
import com.medisync.android.core.notifications.NotificationStore
import com.medisync.android.core.notifications.NotificationType
import kotlinx.coroutines.flow.StateFlow

class NotificationsViewModel(
    private val notificationStore: NotificationStore
) : ViewModel() {

    val notifications: StateFlow<List<AppNotification>> = notificationStore.notifications
    val unreadCount: StateFlow<Int> = notificationStore.unreadCount

    fun markAsRead(id: String) {
        notificationStore.markAsRead(id)
    }

    fun markAllAsRead() {
        notificationStore.markAllAsRead()
    }

    fun clearAll() {
        notificationStore.clearAll()
    }

    fun sendTestNotification(title: String, message: String, type: NotificationType) {
        notificationStore.postNotification(title, message, type, showSystemNotification = true)
    }
}
