package com.medisync.android.presentation.notifications

import android.content.Context
import com.medisync.android.core.notifications.NotificationStore
import com.medisync.android.core.notifications.NotificationType
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class NotificationsViewModelTest {

    private lateinit var mockContext: Context
    private lateinit var notificationStore: NotificationStore
    private lateinit var viewModel: NotificationsViewModel

    @Before
    fun setUp() {
        mockContext = mockk(relaxed = true)
        notificationStore = NotificationStore(mockContext)
        viewModel = NotificationsViewModel(notificationStore)
    }

    @Test
    fun `initial notifications contain seed alerts with unread count`() {
        val list = viewModel.notifications.value
        assertTrue(list.isNotEmpty())
        assertEquals(2, viewModel.unreadCount.value)
    }

    @Test
    fun `markAsRead updates item state and decrements unread count`() {
        val firstId = viewModel.notifications.value.first().id
        viewModel.markAsRead(firstId)

        val updated = viewModel.notifications.value.first { it.id == firstId }
        assertTrue(updated.isRead)
        assertEquals(1, viewModel.unreadCount.value)
    }

    @Test
    fun `markAllAsRead sets all items to read and resets unread count to zero`() {
        viewModel.markAllAsRead()

        assertTrue(viewModel.notifications.value.all { it.isRead })
        assertEquals(0, viewModel.unreadCount.value)
    }

    @Test
    fun `clearAll empties notification list`() {
        viewModel.clearAll()

        assertTrue(viewModel.notifications.value.isEmpty())
        assertEquals(0, viewModel.unreadCount.value)
    }

    @Test
    fun `sendTestNotification inserts new notification at top with unread flag`() {
        viewModel.sendTestNotification(
            title = "Test Dose",
            message = "Take Napa Extra now",
            type = NotificationType.MEDICATION_ALERT
        )

        val first = viewModel.notifications.value.first()
        assertEquals("Test Dose", first.title)
        assertEquals(NotificationType.MEDICATION_ALERT, first.type)
        assertEquals(false, first.isRead)
    }
}
