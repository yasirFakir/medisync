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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Event
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnPrimary
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorEhrTimelineScreen(
    viewModel: DoctorViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddRecordSheet by remember { mutableStateOf(false) }

    var diagnosis by remember { mutableStateOf("") }
    var observations by remember { mutableStateOf("") }
    var followUpDate by remember { mutableStateOf("2026-09-15") }

    val patientName = uiState.selectedPatient?.fullName ?: "Patient"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("$patientName — EHR Timeline", fontWeight = FontWeight.Bold) },
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
                onClick = { showAddRecordSheet = true },
                containerColor = PrimaryTeal,
                contentColor = OnPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Record")
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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Text(
                        text = "Clinical Records & Consultations (${uiState.ehrTimeline.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(text = "OTP Authenticated", type = BadgeType.VERIFIED)
                }
            }

            items(uiState.ehrTimeline, key = { it.recordId }) { record ->
                ElevationCard {
                    Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = record.diagnosis,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = record.sessionDate,
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = record.observations,
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurface
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    record.followUpDate?.let { followUp ->
                        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Event,
                                contentDescription = "Follow up",
                                tint = PrimaryTeal,
                                modifier = Modifier.padding(end = 6.dp)
                            )
                            Text(
                                text = "Follow-up Date: $followUp",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = PrimaryTeal
                            )
                        }
                    }
                }
            }
        }

        // Add Record Sheet
        if (showAddRecordSheet) {
            ModalBottomSheet(onDismissRequest = { showAddRecordSheet = false }) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "New Clinical Consultation Record",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    MediSyncTextField(
                        value = diagnosis,
                        onValueChange = { diagnosis = it },
                        label = "Diagnosis",
                        placeholder = "e.g. Acute Bronchitis / Type 2 Diabetes"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = observations,
                        onValueChange = { observations = it },
                        label = "Clinical Observations & Plan",
                        placeholder = "Patient presents with cough..."
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = followUpDate,
                        onValueChange = { followUpDate = it },
                        label = "Follow-Up Date (YYYY-MM-DD)",
                        placeholder = "2026-09-15"
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Save Clinical Record",
                        enabled = diagnosis.isNotBlank(),
                        onClick = {
                            viewModel.addClinicalRecord(diagnosis, observations, followUpDate)
                            showAddRecordSheet = false
                            diagnosis = ""
                            observations = ""
                        }
                    )
                }
            }
        }
    }
}
