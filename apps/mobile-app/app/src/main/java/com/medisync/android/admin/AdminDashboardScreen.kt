package com.medisync.android.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.theme.CanvasBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    viewModel: AdminViewModel,
    onNavigateToUsers: () -> Unit,
    onNavigateToDrugs: () -> Unit,
    onNavigateToTriage: () -> Unit,
    onNavigateToPharmacies: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadStats()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Admin Dashboard") }) },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            // System status notice (amber banner)
            ElevationCard(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                containerColor = Color(0xFFFFFBEB)
            ) {
                Text("System is running normally", color = Color(0xFF92400E), modifier = Modifier.padding(16.dp))
            }
            
            // Stats grid
            val stats = uiState.stats
            LazyVerticalGrid(columns = GridCells.Fixed(2), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item { StatCard("Total Users", stats?.totalUsers?.toString() ?: "-") }
                item { StatCard("Pharmacies", stats?.totalPharmacies?.toString() ?: "-") }
                item { StatCard("Triage Sessions", stats?.triageSessions?.toString() ?: "-") }
                item { StatCard("Prescriptions", stats?.totalPrescriptions?.toString() ?: "-") }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text("Quick Actions", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onNavigateToUsers, modifier = Modifier.fillMaxWidth()) { Text("Manage Users") }
            Button(onClick = onNavigateToDrugs, modifier = Modifier.fillMaxWidth()) { Text("Manage Drugs") }
            Button(onClick = onNavigateToTriage, modifier = Modifier.fillMaxWidth()) { Text("Triage Logs") }
            Button(onClick = onNavigateToPharmacies, modifier = Modifier.fillMaxWidth()) { Text("Pharmacies") }
        }
    }
}

@Composable
fun StatCard(title: String, value: String) {
    ElevationCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.bodySmall)
            Text(value, style = MaterialTheme.typography.headlineMedium)
        }
    }
}
