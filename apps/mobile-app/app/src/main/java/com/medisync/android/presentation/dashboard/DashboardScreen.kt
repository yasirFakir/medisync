package com.medisync.android.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.painterResource
import com.medisync.android.R
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocalPharmacy
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import com.medisync.android.data.model.AlertStatus
import com.medisync.android.presentation.alerts.AlertsViewModel
import com.medisync.android.presentation.totp.TotpCodeBottomSheet
import com.medisync.android.presentation.totp.TotpViewModel

import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.SwapHoriz

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: UserProfile?,
    totpViewModel: TotpViewModel,
    alertsViewModel: AlertsViewModel? = null,
    appointmentsViewModel: com.medisync.android.presentation.appointments.AppointmentsViewModel? = null,
    prescriptionViewModel: com.medisync.android.presentation.prescription.PrescriptionViewModel? = null,
    unreadNotificationCount: Int = 0,
    onNavigateToNotifications: () -> Unit,
    onNavigateToTriage: () -> Unit,
    onNavigateToScan: () -> Unit,
    onNavigateToWallet: () -> Unit,
    onNavigateToReminders: () -> Unit,
    onNavigateToAppointments: () -> Unit = {},
    onNavigateToPharmacy: () -> Unit = {},
    onNavigateToAlternatives: () -> Unit = {},
    onNavigateToAvailability: () -> Unit = {},
    onNavigateToAdminDashboard: () -> Unit = {},
    onNavigateToAdminUsers: () -> Unit = {},
    onNavigateToAdminDrugs: () -> Unit = {},
    onNavigateToAdminTriage: () -> Unit = {},
    onNavigateToAdminPharmacies: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToDoctorPortal: () -> Unit,
    onNavigateToSessions: () -> Unit,
    onNavigateToPharmacyPortal: () -> Unit,
    onNavigateToInventory: () -> Unit,
    onNavigateToSales: () -> Unit,
    onNavigateToDrugDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    var showTotpSheet by remember { mutableStateOf(false) }

    val displayName = user?.fullName ?: "Valued Patient"
    val role = user?.role ?: UserRole.PATIENT

    val alertsUiState = alertsViewModel?.uiState?.collectAsState()
    val activeAlerts = alertsUiState?.value?.alerts?.filter { it.status == AlertStatus.ACTIVE } ?: emptyList()


    val appointmentsUiState = appointmentsViewModel?.uiState?.collectAsState()
    val upcomingAppointments = appointmentsUiState?.value?.myAppointments?.take(3) ?: emptyList()

    val prescriptionUiState = prescriptionViewModel?.uiState?.collectAsState()
    val recentPrescriptions = prescriptionUiState?.value?.savedPrescriptions?.take(2) ?: emptyList()

    LaunchedEffect(Unit) {
        alertsViewModel?.loadAlerts()
        appointmentsViewModel?.loadMyAppointments()
        prescriptionViewModel?.loadPrescriptions()
    }


    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable(onClick = onNavigateToProfile)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_medisync_logo),
                            contentDescription = "MediSync",
                            tint = PrimaryTeal,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "MediSync",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryTeal
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToNotifications) {
                        BadgedBox(
                            badge = {
                                if (unreadNotificationCount > 0) {
                                    Badge(
                                        containerColor = ErrorCrimson,
                                        contentColor = Color.White
                                    ) {
                                        Text("$unreadNotificationCount")
                                    }
                                }
                            }
                        ) {
                            Icon(
                                Icons.Default.Notifications,
                                contentDescription = "Notifications",
                                tint = OnSurface
                            )
                        }
                    }
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = "My Profile",
                            tint = PrimaryTeal
                        )
                    }
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Sign Out",
                            tint = OnSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CanvasBackground)
            )
        },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp)
        ) {
            // Role Greeting & Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = if (role == UserRole.DOCTOR) "Good day, Dr. ${displayName.removePrefix("Dr. ").removePrefix("Dr.")}" else "Hello, $displayName",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                    Text(
                        text = when (role) {
                            UserRole.PATIENT -> "Your Universal Health Workspace"
                            UserRole.DOCTOR -> "Clinical Practice & EHR Hub"
                            UserRole.PHARMACY -> "Pharmacy POS & Dispenser Hub"
                            UserRole.ADMIN -> "Platform System Administration"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant
                    )
                }
                StatusBadge(
                    text = role.name,
                    type = when (role) {
                        UserRole.PATIENT -> BadgeType.VERIFIED
                        UserRole.DOCTOR -> BadgeType.AI_ASSISTED
                        UserRole.PHARMACY -> BadgeType.EXTRACTED
                        UserRole.ADMIN -> BadgeType.URGENCY_HIGH
                    }
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // AI Triage Callout Banner
            ElevationCard(
                onClick = onNavigateToTriage,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(PrimaryTeal.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "AI Triage",
                            tint = PrimaryTeal,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (role == UserRole.DOCTOR) "AI Clinical Intelligence" else "AI Symptom Triage",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                        Text(
                            text = if (role == UserRole.DOCTOR) "Instant differential reasoning & dosage checks" else "Instant clinical assessment & home care advice",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                    StatusBadge(text = "AI Ready", type = BadgeType.AI_ASSISTED)
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // ─── DOCTOR SPECIFIC VIEW ───────────────────────────────────────────
            
            if (role == UserRole.ADMIN) {
                Text(
                    text = "Admin Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard("Dashboard", "Overview", Icons.Default.Description, PrimaryTeal, Modifier.weight(1f), onClick = onNavigateToAdminDashboard)
                    QuickActionCard("Users", "Manage", Icons.Default.People, SecondarySkyBlue, Modifier.weight(1f), onClick = onNavigateToAdminUsers)
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard("Drugs", "Catalog", Icons.Default.LocalPharmacy, PrimaryTeal, Modifier.weight(1f), onClick = onNavigateToAdminDrugs)
                    QuickActionCard("Triage Logs", "Records", Icons.Default.Description, SecondarySkyBlue, Modifier.weight(1f), onClick = onNavigateToAdminTriage)
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard("Pharmacies", "Verify", Icons.Default.LocalPharmacy, PrimaryTeal, Modifier.weight(1f), onClick = onNavigateToAdminPharmacies)
                }
                Spacer(modifier = Modifier.height(24.dp))
            } else if (role == UserRole.DOCTOR) {

                Text(
                    text = "Clinical Practice Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        title = "Patient Roster",
                        subtitle = "EHR Directory",
                        icon = Icons.Default.People,
                        tint = PrimaryTeal,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToDoctorPortal
                    )
                    QuickActionCard(
                        title = "Appointments",
                        subtitle = "Chamber Schedule",
                        icon = Icons.Default.CalendarMonth,
                        tint = SecondarySkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToAppointments
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        title = "Clinical Notes",
                        subtitle = "EHR Records",
                        icon = Icons.Default.Description,
                        tint = SecondarySkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToSessions
                    )
                    QuickActionCard(
                        title = "Drug Index",
                        subtitle = "Monographs",
                        icon = Icons.Default.LocalPharmacy,
                        tint = PrimaryTeal,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToDrugDetail("metformin-500mg") }
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Consultation Action Card
                ElevationCard(
                    onClick = onNavigateToDoctorPortal,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(PrimaryTeal.copy(alpha = 0.1f), shape = MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.People, contentDescription = "Consultation", tint = PrimaryTeal)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Start Patient Consultation",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Select patient and view complete EHR treatment history",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                        }
                        StatusBadge(text = "Active", type = BadgeType.VERIFIED)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Clinical Guidance Notice Banner (matching web app)
                ElevationCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = Color(0xFFFFFBEB)
                ) {

                    Column {
                        Text(
                            text = "⚠ Clinical Record Standard",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF92400E)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Always ensure patient diagnosis notes and follow-up dates are updated upon completing every consultation session.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF78350F)
                        )
                    }
                }
            } else {
                // ─── PATIENT / PHARMACY / ADMIN VIEW ─────────────────────────────
                Text(
                    text = "Clinical Hub Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        title = "Scan Rx",
                        subtitle = "Camera OCR",
                        icon = Icons.Default.CameraAlt,
                        tint = PrimaryTeal,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToScan
                    )
                    QuickActionCard(
                        title = "Rx Wallet",
                        subtitle = "Saved Prescriptions",
                        icon = Icons.Default.Description,
                        tint = SecondarySkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToWallet
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        title = "Reminders",
                        subtitle = "Alarms & Routine",
                        icon = Icons.Default.Alarm,
                        tint = PrimaryTeal,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToReminders
                    )
                    if (role == UserRole.PHARMACY) {
                        QuickActionCard(
                            title = "Dispenser",
                            subtitle = "Pharmacy POS",
                            icon = Icons.Default.PointOfSale,
                            tint = SecondarySkyBlue,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToPharmacyPortal
                        )
                    } else {
                        QuickActionCard(
                            title = "Book Doctor",
                            subtitle = "Appointments",
                            icon = Icons.Default.CalendarMonth,
                            tint = SecondarySkyBlue,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToAppointments
                        )
                    }
                }

                if (role == UserRole.PHARMACY) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        QuickActionCard(
                            title = "Inventory",
                            subtitle = "Stock Management",
                            icon = Icons.Default.Description,
                            tint = PrimaryTeal,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToInventory
                        )
                        QuickActionCard(
                            title = "Sales",
                            subtitle = "Revenue & Reports",
                            icon = Icons.Default.PointOfSale,
                            tint = SecondarySkyBlue,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToSales
                        )
                    }
                }

                if (role == UserRole.PATIENT) {
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        QuickActionCard(
                            title = "Find Medicines",
                            subtitle = "Check Availability",
                            icon = Icons.Default.LocalPharmacy,
                            tint = SecondarySkyBlue,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToAvailability
                        )
                        QuickActionCard(
                            title = "Legacy Pharmacies",
                            subtitle = "Stock & Map",
                            icon = Icons.Default.LocalPharmacy,
                            tint = SecondarySkyBlue,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToPharmacy
                        )
                        QuickActionCard(
                            title = "Alternatives",
                            subtitle = "Cheaper Generics",
                            icon = Icons.Default.SwapHoriz,
                            tint = PrimaryTeal,
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToAlternatives
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Active Adherence Widget
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Today's Medication Schedule",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                    Text(
                        text = "${activeAlerts.size} scheduled",
                        style = MaterialTheme.typography.bodySmall,
                        color = PrimaryTeal,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable(onClick = onNavigateToReminders)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                if (activeAlerts.isEmpty()) {
                    ElevationCard(
                        onClick = onNavigateToReminders,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .background(PrimaryTeal.copy(alpha = 0.1f), shape = MaterialTheme.shapes.medium),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Alarm,
                                    contentDescription = "Medication",
                                    tint = PrimaryTeal
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "No scheduled medications yet",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Tap to set up daily reminder schedules & alarms",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                            }
                            StatusBadge(text = "+ Add", type = BadgeType.AI_ASSISTED)
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        activeAlerts.forEach { alert ->
                            ElevationCard(
                                onClick = { onNavigateToReminders() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(44.dp)
                                            .background(PrimaryTeal.copy(alpha = 0.1f), shape = MaterialTheme.shapes.medium),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Alarm,
                                            contentDescription = "Medication",
                                            tint = PrimaryTeal
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(14.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = alert.medicineName,
                                            style = MaterialTheme.typography.bodyLarge,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "${alert.dosage} • ${alert.scheduledTime} (${alert.frequency})",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = OnSurfaceVariant
                                        )
                                    }
                                    IconButton(
                                        onClick = {
                                            alertsViewModel?.markDoseTaken(alert.alertId)
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "Take Dose",
                                            tint = PrimaryTeal,
                                            modifier = Modifier.size(28.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                Text("Upcoming Appointments", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = OnSurface)
                Spacer(modifier = Modifier.height(12.dp))
                if (upcomingAppointments.isEmpty()) {
                    ElevationCard(modifier = Modifier.fillMaxWidth()) {
                        Text("No upcoming appointments", modifier = Modifier.padding(16.dp), color = OnSurfaceVariant)
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        upcomingAppointments.forEach { appt ->
                            ElevationCard(modifier = Modifier.fillMaxWidth(), onClick = onNavigateToAppointments) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("Dr. ${appt.doctorName}", style = MaterialTheme.typography.titleMedium)
                                    Text("${appt.appointmentDate} at ${appt.startTime}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Badge { Text(appt.status.name) }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                Text("Recent Prescriptions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = OnSurface)
                Spacer(modifier = Modifier.height(12.dp))
                if (recentPrescriptions.isEmpty()) {
                    ElevationCard(modifier = Modifier.fillMaxWidth()) {
                        Text("No recent prescriptions", modifier = Modifier.padding(16.dp), color = OnSurfaceVariant)
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        recentPrescriptions.forEach { rx ->
                            ElevationCard(modifier = Modifier.fillMaxWidth(), onClick = onNavigateToWallet) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("Dr. ${rx.doctorName}", style = MaterialTheme.typography.titleMedium)
                                    Text("Date: ${rx.createdAt}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                    Text("${rx.medicines.size} medicines prescribed", style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                }

            }
        }


        if (showTotpSheet) {
            TotpCodeBottomSheet(
                viewModel = totpViewModel,
                onDismiss = { showTotpSheet = false }
            )
        }
    }
}

@Composable
private fun QuickActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    ElevationCard(
        onClick = onClick,
        modifier = modifier
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(tint.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = title, tint = tint)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = OnSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant
            )
        }
    }
}
