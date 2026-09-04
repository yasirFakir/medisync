package com.medisync.android.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.theme.CanvasBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminTriageScreen(
    viewModel: AdminViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTriageLogs()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Triage Logs") }) },
        containerColor = CanvasBackground
    ) { paddingValues ->
        LazyColumn(modifier = Modifier.padding(paddingValues).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.triageLogs) { log ->
                ElevationCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(log.patientName ?: "Unknown Patient", style = MaterialTheme.typography.titleMedium)
                        Text(log.createdAt, style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Symptoms: ${log.symptoms}", maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
                        Text("Recommendation: ${log.recommendation}", maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}
