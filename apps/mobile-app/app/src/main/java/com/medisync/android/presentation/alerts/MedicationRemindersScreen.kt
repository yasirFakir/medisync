package com.medisync.android.presentation.alerts

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.notifications.NotificationHelper
import com.medisync.android.core.notifications.NotificationType
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnPrimary
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.data.model.AlertStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicationRemindersScreen(
    viewModel: AlertsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showAddSheet by remember { mutableStateOf(false) }

    var medicineName by remember { mutableStateOf("") }
    var dosage by remember { mutableStateOf("500 mg") }
    var frequency by remember { mutableStateOf("1-0-0") }
    var scheduledTime by remember { mutableStateOf("08:00") }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            NotificationHelper.showSystemNotification(
                context,
                title = "Medication Dose Due: Napa Extra",
                message = "Take 1 tablet (500mg/65mg) with water.",
                type = NotificationType.MEDICATION_ALERT
            )
            Toast.makeText(context, "System push notification sent!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "Notification permission is required", Toast.LENGTH_SHORT).show()
        }
    }

    fun triggerSystemNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (hasPermission) {
                NotificationHelper.showSystemNotification(
                    context,
                    title = "Medication Dose Due: Napa Extra",
                    message = "Take 1 tablet (500mg/65mg) with water.",
                    type = NotificationType.MEDICATION_ALERT
                )
            } else {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            NotificationHelper.showSystemNotification(
                context,
                title = "Medication Dose Due: Napa Extra",
                message = "Take 1 tablet (500mg/65mg) with water.",
                type = NotificationType.MEDICATION_ALERT
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Medication Reminders", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CanvasBackground)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddSheet = true },
                containerColor = PrimaryTeal,
                contentColor = OnPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Reminder")
            }
        },
        containerColor = CanvasBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 16.dp)
        ) {
            item {
                // Live Android System Push Notification Test Banner
                ElevationCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(PrimaryTeal.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = PrimaryTeal)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Android System Push Alert",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Triggers real status bar alarm with sound & vibration",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                            }
                        }
                        MediSyncButton(
                            text = "Test Alarm",
                            onClick = { triggerSystemNotification() },
                            modifier = Modifier.width(110.dp)
                        )
                    }
                }
            }

            item {
                Text(
                    text = "Daily Treatment Routine (${uiState.alerts.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(uiState.alerts, key = { it.alertId }) { alert ->
                ElevationCard {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(PrimaryTeal.copy(alpha = 0.1f), shape = MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Alarm, contentDescription = "Alarm", tint = PrimaryTeal)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = alert.medicineName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(text = "${alert.dosage} • Time: ${alert.scheduledTime}", style = MaterialTheme.typography.bodyMedium, color = OnSurfaceVariant)
                            Text(text = "Schedule: ${alert.frequency}", style = MaterialTheme.typography.bodySmall, color = PrimaryTeal, fontWeight = FontWeight.SemiBold)
                        }
                        Switch(
                            checked = alert.status == AlertStatus.ACTIVE,
                            onCheckedChange = { viewModel.toggleAlertStatus(alert) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = OnPrimary,
                                checkedTrackColor = PrimaryTeal
                            )
                        )
                        IconButton(onClick = { viewModel.deleteAlert(alert) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorCrimson)
                        }
                    }
                }
            }
        }

        // Add Reminder Sheet
        if (showAddSheet) {
            ModalBottomSheet(onDismissRequest = { showAddSheet = false }) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "New Medication Reminder",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    MediSyncTextField(
                        value = medicineName,
                        onValueChange = { medicineName = it },
                        label = "Medicine Name",
                        placeholder = "e.g. Metformin HCl"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MediSyncTextField(
                            value = dosage,
                            onValueChange = { dosage = it },
                            label = "Dosage",
                            placeholder = "500 mg",
                            modifier = Modifier.weight(1f)
                        )
                        MediSyncTextField(
                            value = scheduledTime,
                            onValueChange = { scheduledTime = it },
                            label = "Time (HH:mm)",
                            placeholder = "08:00",
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = frequency,
                        onValueChange = { frequency = it },
                        label = "Frequency",
                        placeholder = "1-0-0 / Once daily"
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Save Reminder",
                        enabled = medicineName.isNotBlank(),
                        onClick = {
                            viewModel.addAlert(medicineName, dosage, frequency, scheduledTime)
                            showAddSheet = false
                            medicineName = ""
                        }
                    )
                }
            }
        }
    }
}
