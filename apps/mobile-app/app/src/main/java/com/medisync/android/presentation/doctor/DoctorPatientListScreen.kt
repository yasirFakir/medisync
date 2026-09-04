package com.medisync.android.presentation.doctor

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ButtonVariant
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorPatientListScreen(
    viewModel: DoctorViewModel,
    onNavigateToTimeline: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showOtpDialog by remember { mutableStateOf(false) }
    var otpInput by remember { mutableStateOf("") }
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Assigned Patients", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 20.dp)
        ) {
            MediSyncTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = "Search Patient Roster",
                placeholder = "Search by name or email...",
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = PrimaryTeal)
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 16.dp)
            ) {
                items(uiState.patients, key = { it.patientId }) { patient ->
                    ElevationCard(
                        onClick = {
                            viewModel.selectPatient(patient)
                            showOtpDialog = true
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = patient.fullName,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${patient.email} • ${patient.phoneNumber ?: "N/A"}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Last Consult: ${patient.lastConsultationDate ?: "Recent"}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = SecondarySkyBlue,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Icon(Icons.Default.Lock, contentDescription = "Unlock EHR", tint = PrimaryTeal)
                        }
                    }
                }
            }
        }

        // OTP Access Gate Sheet
        if (showOtpDialog && uiState.selectedPatient != null) {
            ModalBottomSheet(onDismissRequest = { showOtpDialog = false }) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    Text(
                        text = "Unlock Patient Medical Records",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ask ${uiState.selectedPatient?.fullName} for their 6-digit dynamic passcode.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    MediSyncTextField(
                        value = otpInput,
                        onValueChange = { otpInput = it },
                        label = "Patient 6-Digit OTP",
                        placeholder = "e.g. 481920"
                    )

                    if (uiState.errorMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = uiState.errorMessage ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = ErrorCrimson
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Verify & Access EHR Timeline",
                        isLoading = uiState.isLoading,
                        onClick = {
                            viewModel.unlockEhrWithOtp(otpInput) {
                                showOtpDialog = false
                                otpInput = ""
                                onNavigateToTimeline()
                            }
                        }
                    )
                }
            }
        }
    }
}
