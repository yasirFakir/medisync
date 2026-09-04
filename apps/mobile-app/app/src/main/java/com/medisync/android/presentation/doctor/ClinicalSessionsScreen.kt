package com.medisync.android.presentation.doctor

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClinicalSessionsScreen(
    viewModel: DoctorViewModel,
    onNavigateToEhr: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var filterType by remember { mutableStateOf("All") }
    var selectedSession by remember { mutableStateOf<ClinicalSession?>(null) }
    var showDetailSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadSessions()
    }

    val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

    val sessions = uiState.sessions
    val totalSessions = sessions.size
    val uniquePatients = sessions.map { it.patientId }.distinct().size
    val overdueFollowUps = sessions.count { it.followUpDate != null && it.followUpDate < todayStr }
    val dueToday = sessions.count { it.followUpDate == todayStr }

    val filteredSessions = sessions.filter { session ->
        val matchesSearch = if (searchQuery.isNotBlank()) {
            (session.patientName?.contains(searchQuery, ignoreCase = true) == true) ||
            session.diagnosis.contains(searchQuery, ignoreCase = true)
        } else true

        val matchesFilter = when (filterType) {
            "With Follow-up" -> session.followUpDate != null
            "Overdue" -> session.followUpDate != null && session.followUpDate < todayStr
            else -> true
        }

        matchesSearch && matchesFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clinical Session Logs", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 16.dp)
        ) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Total Sessions", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(totalSessions.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Unique Patients", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(uniquePatients.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Overdue Follow-ups", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(overdueFollowUps.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Due Today", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(dueToday.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            MediSyncTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = "Search",
                placeholder = "Search by patient name or diagnosis...",
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                FilterChip(
                    selected = filterType == "All",
                    onClick = { filterType = "All" },
                    label = { Text("All") }
                )
                FilterChip(
                    selected = filterType == "With Follow-up",
                    onClick = { filterType = "With Follow-up" },
                    label = { Text("With Follow-up") }
                )
                FilterChip(
                    selected = filterType == "Overdue",
                    onClick = { filterType = "Overdue" },
                    label = { Text("Overdue") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredSessions.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("No sessions found", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredSessions, key = { it.recordId }) { session ->
                        ElevationCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = session.patientName ?: "Unknown Patient",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = session.createdAt ?: "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            Text(
                                text = session.diagnosis,
                                style = MaterialTheme.typography.bodyMedium,
                                color = OnSurface,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            if (session.followUpDate != null) {
                                val badgeType = when {
                                    session.followUpDate < todayStr -> BadgeType.URGENCY_HIGH // Overdue
                                    session.followUpDate == todayStr -> BadgeType.AI_ASSISTED // Today
                                    else -> BadgeType.VERIFIED // Upcoming
                                }
                                StatusBadge(text = "Follow-up: ${session.followUpDate}", type = badgeType)
                                Spacer(modifier = Modifier.height(8.dp))
                            }

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                MediSyncButton(
                                    text = "View Details",
                                    onClick = {
                                        selectedSession = session
                                        showDetailSheet = true
                                    },
                                    modifier = Modifier.weight(1f),
                                    variant = com.medisync.android.core.components.ButtonVariant.OUTLINE
                                )
                                MediSyncButton(
                                    text = "View EHR",
                                    onClick = { onNavigateToEhr() },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }

        if (showDetailSheet && selectedSession != null) {
            val session = selectedSession!!
            ModalBottomSheet(onDismissRequest = { showDetailSheet = false }) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text("Session Details", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Patient", fontWeight = FontWeight.Bold)
                    Text(session.patientName ?: "Unknown", style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Diagnosis", fontWeight = FontWeight.Bold)
                    Text(session.diagnosis, style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Observations", fontWeight = FontWeight.Bold)
                    Text(session.observations, style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (session.followUpDate != null) {
                        Text("Follow-up Date", fontWeight = FontWeight.Bold)
                        Text(session.followUpDate, style = MaterialTheme.typography.bodyMedium)
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
