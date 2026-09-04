package com.medisync.android.presentation.auth

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.data.model.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    initialRole: UserRole,
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    var email by remember { mutableStateOf(if (initialRole == UserRole.DOCTOR) "doctor@medisync.com" else if (initialRole == UserRole.PHARMACY) "pharmacy@medisync.com" else "patient@medisync.com") }
    var password by remember { mutableStateOf("demo1234") }

    LaunchedEffect(initialRole) {
        viewModel.selectRole(initialRole)
    }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onLoginSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sign In", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
                .padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Header
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.headlineLarge,
                    color = OnSurface,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Accessing as ",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant
                    )
                    StatusBadge(
                        text = uiState.selectedRole.name,
                        type = when (uiState.selectedRole) {
                            UserRole.PATIENT -> BadgeType.VERIFIED
                            UserRole.DOCTOR -> BadgeType.AI_ASSISTED
                            UserRole.PHARMACY -> BadgeType.EXTRACTED
                            else -> BadgeType.VERIFIED
                        }
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // One-Tap Quick Demo Login Card
                ElevationCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.FlashOn, contentDescription = "Quick Demo", tint = PrimaryTeal)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Quick Demo Mode (1-Tap Login)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = uiState.selectedRole == UserRole.PATIENT,
                            onClick = {
                                viewModel.selectRole(UserRole.PATIENT)
                                email = "patient@medisync.com"
                                password = "demo"
                                viewModel.login(email, password)
                            },
                            label = { Text("Patient", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryTeal,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = uiState.selectedRole == UserRole.DOCTOR,
                            onClick = {
                                viewModel.selectRole(UserRole.DOCTOR)
                                email = "doctor@medisync.com"
                                password = "demo"
                                viewModel.login(email, password)
                            },
                            label = { Text("Doctor", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = SecondarySkyBlue,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = uiState.selectedRole == UserRole.PHARMACY,
                            onClick = {
                                viewModel.selectRole(UserRole.PHARMACY)
                                email = "pharmacy@medisync.com"
                                password = "demo"
                                viewModel.login(email, password)
                            },
                            label = { Text("Pharmacy", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryTeal,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Input fields
                MediSyncTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email Address",
                    placeholder = "name@example.com",
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = "Email", tint = PrimaryTeal)
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                MediSyncTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password",
                    placeholder = "Enter your password",
                    visualTransformation = PasswordVisualTransformation(),
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = "Password", tint = PrimaryTeal)
                    }
                )

                if (uiState.errorMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = uiState.errorMessage ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = ErrorCrimson,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                MediSyncButton(
                    text = "Sign In",
                    isLoading = uiState.isLoading,
                    onClick = {
                        viewModel.login(email, password)
                    }
                )
            }

            // Footer
            Row(
                modifier = Modifier
                    .padding(vertical = 16.dp)
                    .clickable(onClick = onNavigateToRegister),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Don't have an account? ",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant
                )
                Text(
                    text = "Create Account",
                    style = MaterialTheme.typography.bodyMedium,
                    color = PrimaryTeal,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
