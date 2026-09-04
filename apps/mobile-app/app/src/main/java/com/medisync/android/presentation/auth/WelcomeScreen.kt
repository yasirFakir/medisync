package com.medisync.android.presentation.auth

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.LocalPharmacy
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ButtonVariant
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.data.model.UserRole

@Composable
fun WelcomeScreen(
    onNavigateToLogin: (UserRole) -> Unit,
    onNavigateToRegister: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(20.dp))
            
            // Brand Logo & Icon
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(PrimaryTeal.copy(alpha = 0.12f), shape = MaterialTheme.shapes.large),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.HealthAndSafety,
                    contentDescription = "MediSync Icon",
                    tint = PrimaryTeal,
                    modifier = Modifier.size(44.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "MediSync",
                style = MaterialTheme.typography.displayLarge,
                color = PrimaryTeal,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "AI-Powered Medical Care, Prescription Digitizer & Dynamic Health Wallet",
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "Select Your Portal to Continue",
                style = MaterialTheme.typography.labelLarge,
                color = OnSurface,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Role Portal Selector Cards
            RolePortalCard(
                title = "Patient Portal",
                subtitle = "AI Triage, Prescriptions & Medication Reminders",
                icon = Icons.Default.Person,
                tint = PrimaryTeal,
                onClick = { onNavigateToLogin(UserRole.PATIENT) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            RolePortalCard(
                title = "Doctor Portal",
                subtitle = "OTP-Gated EHR Timeline & Clinical Records",
                icon = Icons.Default.MedicalServices,
                tint = SecondarySkyBlue,
                onClick = { onNavigateToLogin(UserRole.DOCTOR) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            RolePortalCard(
                title = "Pharmacy Portal",
                subtitle = "Live Inventory, OTP Dispenser & POS Checkout",
                icon = Icons.Default.LocalPharmacy,
                tint = PrimaryTeal,
                onClick = { onNavigateToLogin(UserRole.PHARMACY) }
            )
        }

        Column(modifier = Modifier.fillMaxWidth().padding(top = 28.dp)) {
            MediSyncButton(
                text = "Create an Account",
                onClick = onNavigateToRegister,
                variant = ButtonVariant.OUTLINE
            )
        }
    }
}

@Composable
private fun RolePortalCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tint: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    ElevationCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(tint.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = tint,
                    modifier = Modifier.size(26.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = OnSurface,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant
                )
            }
        }
    }
}
