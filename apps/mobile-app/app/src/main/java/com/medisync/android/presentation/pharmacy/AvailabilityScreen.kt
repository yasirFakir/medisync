package com.medisync.android.presentation.pharmacy

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
fun AvailabilityScreen(
    viewModel: AvailabilityViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var manualDrugName by remember { mutableStateOf("") }
    var manualSalt by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        viewModel.loadPrescriptions()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Medicine Availability") }) },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            // Step 1: Query Builder
            Text("Add Medicines", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                TextField(value = manualDrugName, onValueChange = { manualDrugName = it }, label = { Text("Drug Name") }, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(8.dp))
                TextField(value = manualSalt, onValueChange = { manualSalt = it }, label = { Text("Salt") }, modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {
                if (manualDrugName.isNotBlank()) {
                    viewModel.addMedicine(AvailabilityMedicine(manualDrugName, manualSalt))
                    manualDrugName = ""
                    manualSalt = ""
                }
            }) { Text("Add") }

            Spacer(modifier = Modifier.height(16.dp))
            
            // Chips
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                uiState.selectedMedicines.forEach { med ->
                    InputChip(
                        selected = true,
                        onClick = { viewModel.removeMedicine(med) },
                        label = { Text(med.brandName) }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { viewModel.checkAvailability() }, modifier = Modifier.fillMaxWidth()) {
                Text("Check Pharmacy Availability")
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Step 2: Results
            if (uiState.isLoading) {
                CircularProgressIndicator()
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(uiState.results) { pharmacy ->
                        ElevationCard(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(pharmacy.storeName, style = MaterialTheme.typography.titleMedium)
                                Text(pharmacy.address, style = MaterialTheme.typography.bodySmall)
                                
                                val color = when {
                                    pharmacy.availabilityPercent >= 80 -> Color(0xFF4CAF50)
                                    pharmacy.availabilityPercent >= 50 -> Color(0xFFFFC107)
                                    else -> Color(0xFFF44336)
                                }
                                Badge(containerColor = color) { Text("${pharmacy.availabilityPercent}% Match") }
                                
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Matching: ${pharmacy.matchingDrugs.joinToString()}", color = Color(0xFF4CAF50))
                                Text("Alternatives: ${pharmacy.alternativeDrugs.joinToString()}", color = Color(0xFFFFC107))
                                Text("Missing: ${pharmacy.missingDrugs.joinToString()}", color = Color(0xFFF44336))
                                
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedButton(onClick = { /* Open maps */ }) { Text("Get Directions") }
                            }
                        }
                    }
                }
            }
        }
    }
}
