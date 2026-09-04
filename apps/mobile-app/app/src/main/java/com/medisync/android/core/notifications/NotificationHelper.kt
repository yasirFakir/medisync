package com.medisync.android.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.medisync.android.MainActivity

object NotificationHelper {

    const val CHANNEL_MEDICATION = "medisync_medication_alarms"
    const val CHANNEL_CLINICAL = "medisync_clinical_alerts"
    const val CHANNEL_SECURITY = "medisync_security"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val medChannel = NotificationChannel(
                CHANNEL_MEDICATION,
                "Medication Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Timely alarms and schedules to take prescribed medicines"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            }

            val clinicalChannel = NotificationChannel(
                CHANNEL_CLINICAL,
                "Clinical & Prescription Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Prescription OCR verification and doctor EHR updates"
                enableVibration(true)
                setShowBadge(true)
            }

            val securityChannel = NotificationChannel(
                CHANNEL_SECURITY,
                "Security & Access Passcodes",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Dynamic TOTP access PINs and authorization notices"
                enableVibration(true)
                setShowBadge(true)
            }

            manager.createNotificationChannels(listOf(medChannel, clinicalChannel, securityChannel))
        }
    }

    fun showSystemNotification(
        context: Context,
        title: String,
        message: String,
        type: NotificationType = NotificationType.SYSTEM_ALERT
    ) {
        createNotificationChannels(context)

        val channelId = when (type) {
            NotificationType.MEDICATION_ALERT -> CHANNEL_MEDICATION
            NotificationType.SECURITY_TOTP -> CHANNEL_SECURITY
            else -> CHANNEL_CLINICAL
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val iconRes = when (type) {
            NotificationType.MEDICATION_ALERT -> android.R.drawable.ic_lock_idle_alarm
            NotificationType.SECURITY_TOTP -> android.R.drawable.ic_lock_lock
            NotificationType.PRESCRIPTION_VERIFIED -> android.R.drawable.ic_menu_agenda
            else -> android.R.drawable.ic_dialog_info
        }

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 400, 200, 400))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        val manager = NotificationManagerCompat.from(context)
        val notificationId = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
        try {
            manager.notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // Permission not granted on Android 13+
        }
    }
}
