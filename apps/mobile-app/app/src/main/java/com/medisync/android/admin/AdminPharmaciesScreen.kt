package com.medisync.android.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.theme.CanvasBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminPharmaciesScreen(
    viewModel: AdminViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadPharmacies()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Pharmacies") }) },
        containerColor = CanvasBackground
    ) { paddingValues ->
        LazyColumn(modifier = Modifier.padding(paddingValues).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.pharmacies) { pharmacy ->
                ElevationCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(pharmacy.storeName, style = MaterialTheme.typography.titleMedium)
                        Text("${pharmacy.city} • ${pharmacy.email}", style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(8.dp))
                        if (pharmacy.isVerified) {
                            Badge(containerColor = Color(0xFF4CAF50)) { Text("Verified") }
                        } else {
                            Button(onClick = { viewModel.verifyPharmacy(pharmacy.pharmacyId, {}) }) {
                                Text("Verify")
                            }
                        }
                    }
                }
            }
        }
    }
}
