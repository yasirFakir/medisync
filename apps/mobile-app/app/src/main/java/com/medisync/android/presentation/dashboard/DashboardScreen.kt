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
import com.medisync.android.presentation.totp.TotpCodeBottomSheet
import com.medisync.android.presentation.totp.TotpViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: UserProfile?,
    totpViewModel: TotpViewModel,
    unreadNotificationCount: Int = 0,
    onNavigateToNotifications: () -> Unit,
    onNavigateToTriage: () -> Unit,
    onNavigateToScan: () -> Unit,
    onNavigateToWallet: () -> Unit,
    onNavigateToReminders: () -> Unit,
    onNavigateToDoctorPortal: () -> Unit,
    onNavigateToPharmacyPortal: () -> Unit,
    onNavigateToDrugDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    var showTotpSheet by remember { mutableStateOf(false) }

    val displayName = user?.fullName ?: "Valued Patient"
    val role = user?.role ?: UserRole.PATIENT

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
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
            // Patient Greeting & Role Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = "Hello, $displayName",
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

            Spacer(modifier = Modifier.height(20.dp))

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
                            text = "AI Symptom Triage",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                        Text(
                            text = "Instant clinical assessment & home care advice",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                    StatusBadge(text = "AI Ready", type = BadgeType.AI_ASSISTED)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Dynamic Passcode Generator Banner
            ElevationCard(
                onClick = { showTotpSheet = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(PrimaryTeal.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = "Security",
                            tint = PrimaryTeal
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Generate Access Passcode",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "30-sec dynamic OTP for doctors & pharmacies",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                    Icon(Icons.Default.Key, contentDescription = "Passcode", tint = PrimaryTeal)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Quick Action Grid
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
                if (role == UserRole.DOCTOR) {
                    QuickActionCard(
                        title = "Doctor EHR",
                        subtitle = "Patient Roster",
                        icon = Icons.Default.People,
                        tint = SecondarySkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToDoctorPortal
                    )
                } else if (role == UserRole.PHARMACY) {
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
                        title = "Doctor Portal",
                        subtitle = "EHR Access",
                        icon = Icons.Default.People,
                        tint = SecondarySkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToDoctorPortal
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Active Adherence Widget
            Text(
                text = "Today's Medication Schedule",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = OnSurface
            )
            Spacer(modifier = Modifier.height(12.dp))

            ElevationCard(
                onClick = { onNavigateToDrugDetail("metformin-500mg") }
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
                            text = "Metformin Hydrochloride",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "500mg • Morning (1+0+0) with Meal",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                    StatusBadge(text = "Active", type = BadgeType.VERIFIED)
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
