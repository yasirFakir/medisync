package com.medisync.android.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.theme.CanvasBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDrugsScreen(
    viewModel: AdminViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var search by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showAddDrugSheet by remember { mutableStateOf(false) }

    LaunchedEffect(search) {
        viewModel.loadDrugs(search)
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Drug Catalog") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDrugSheet = true }) {
                Text("+ Add Drug")
            }
        },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            TextField(value = search, onValueChange = { search = it }, label = { Text("Search Drugs") }, modifier = Modifier.fillMaxWidth())
            Spacer(modifier = Modifier.height(16.dp))
            
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(uiState.drugs) { drug ->
                    ElevationCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(drug.brandName, style = MaterialTheme.typography.titleMedium)
                            Text("${drug.genericName} • ${drug.strength}", style = MaterialTheme.typography.bodySmall)
                            Text("Manufacturer: ${drug.manufacturer ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
                            Text("Price: ৳${drug.price ?: 0.0}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
        
        if (showAddDrugSheet) {
            ModalBottomSheet(
                onDismissRequest = { showAddDrugSheet = false },
                sheetState = sheetState
            ) {
                AddDrugForm(viewModel = viewModel, onDismiss = {
                    scope.launch { sheetState.hide() }.invokeOnCompletion {
                        if (!sheetState.isVisible) {
                            showAddDrugSheet = false
                        }
                    }
                })
            }
        }
    }
}

@Composable
fun AddDrugForm(viewModel: AdminViewModel, onDismiss: () -> Unit) {
    var brandName by remember { mutableStateOf("") }
    var genericName by remember { mutableStateOf("") }
    var saltComposition by remember { mutableStateOf("") }
    var strength by remember { mutableStateOf("") }
    var manufacturer by remember { mutableStateOf("") }
    var priceStr by remember { mutableStateOf("") }
    
    Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Add New Drug", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        TextField(value = brandName, onValueChange = { brandName = it }, label = { Text("Brand Name") }, modifier = Modifier.fillMaxWidth())
        TextField(value = genericName, onValueChange = { genericName = it }, label = { Text("Generic Name") }, modifier = Modifier.fillMaxWidth())
        TextField(value = saltComposition, onValueChange = { saltComposition = it }, label = { Text("Salt Composition") }, modifier = Modifier.fillMaxWidth())
        TextField(value = strength, onValueChange = { strength = it }, label = { Text("Strength") }, modifier = Modifier.fillMaxWidth())
        TextField(value = manufacturer, onValueChange = { manufacturer = it }, label = { Text("Manufacturer") }, modifier = Modifier.fillMaxWidth())
        TextField(value = priceStr, onValueChange = { priceStr = it }, label = { Text("Price") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                val price = priceStr.toDoubleOrNull() ?: 0.0
                viewModel.addDrug(
                    request = AddDrugRequest(brandName, genericName, saltComposition, strength, manufacturer, price),
                    onSuccess = onDismiss,
                    onError = { /* Handle error */ }
                )
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Save Drug")
        }
    }
}
