package com.medisync.android.presentation.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.data.model.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    viewModel: AuthViewModel,
    onRegisterSuccess: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf(UserRole.PATIENT) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onRegisterSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Account", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 24.dp, vertical = 16.dp)
        ) {
            Text(
                text = "Join MediSync",
                style = MaterialTheme.typography.headlineLarge,
                color = OnSurface,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Select your role and enter your details",
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant
            )

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Account Role",
                style = MaterialTheme.typography.labelLarge,
                color = OnSurface,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(UserRole.PATIENT, UserRole.DOCTOR, UserRole.PHARMACY).forEach { role ->
                    FilterChip(
                        selected = selectedRole == role,
                        onClick = { selectedRole = role },
                        label = { Text(role.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryTeal,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            ElevationCard {
                MediSyncTextField(
                    value = fullName,
                    onValueChange = { fullName = it; viewModel.clearError() },
                    label = "Full Name",
                    placeholder = "Dr. Jane Doe / John Doe",
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = "Name", tint = PrimaryTeal)
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                MediSyncTextField(
                    value = email,
                    onValueChange = { email = it; viewModel.clearError() },
                    label = "Email Address",
                    placeholder = "user@example.com",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = "Email", tint = PrimaryTeal)
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                MediSyncTextField(
                    value = phone,
                    onValueChange = { phone = it; viewModel.clearError() },
                    label = "Phone Number (Optional)",
                    placeholder = "+8801700000000",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    leadingIcon = {
                        Icon(Icons.Default.Phone, contentDescription = "Phone", tint = PrimaryTeal)
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                MediSyncTextField(
                    value = password,
                    onValueChange = { password = it; viewModel.clearError() },
                    label = "Password",
                    placeholder = "Minimum 6 characters",
                    isPassword = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = "Password", tint = PrimaryTeal)
                    }
                )
            }

            if (uiState.errorMessage != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = uiState.errorMessage ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ErrorCrimson,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            MediSyncButton(
                text = "Create Account",
                isLoading = uiState.isLoading,
                onClick = { viewModel.register(fullName, email, password, selectedRole, phone) }
            )
        }
    }
}
