package com.medisync.android.presentation.pharmacy

import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnSurfaceVariant
import android.widget.Toast

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdateStockScreen(
    viewModel: PharmacyInventoryViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedDrug by remember { mutableStateOf<DrugMasterItem?>(null) }
    
    var quantity by remember { mutableStateOf("") }
    var batchNumber by remember { mutableStateOf("") }
    var expiryDate by remember { mutableStateOf("") }
    var costPrice by remember { mutableStateOf("") }
    var sellingPrice by remember { mutableStateOf("") }

    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Stock", fontWeight = FontWeight.Bold) },
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
            
            if (selectedDrug == null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MediSyncTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        label = "Search",
                        placeholder = "Search drug by name...",
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    MediSyncButton(
                        text = "Search",
                        onClick = { viewModel.searchDrugs(searchQuery) },
                        modifier = Modifier.padding(top = 16.dp)
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (uiState.drugSearchResults.isNotEmpty()) {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(uiState.drugSearchResults.take(5)) { drug ->
                            ElevationCard(
                                onClick = { selectedDrug = drug }
                            ) {
                                Text(text = drug.brandName, fontWeight = FontWeight.Bold)
                                Text(text = "${drug.genericName} • ${drug.strength}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                            }
                        }
                    }
                }
            } else {
                StatusBadge(
                    text = "✓ ${selectedDrug!!.brandName} (${selectedDrug!!.genericName})",
                    type = BadgeType.VERIFIED
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                MediSyncTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = "Quantity",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                MediSyncTextField(
                    value = batchNumber,
                    onValueChange = { batchNumber = it },
                    label = "Batch Number"
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                MediSyncTextField(
                    value = expiryDate,
                    onValueChange = { expiryDate = it },
                    label = "Expiry Date (YYYY-MM-DD)",
                    placeholder = "2026-12-31"
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                MediSyncTextField(
                    value = costPrice,
                    onValueChange = { costPrice = it },
                    label = "Cost Price (৳)",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                MediSyncTextField(
                    value = sellingPrice,
                    onValueChange = { sellingPrice = it },
                    label = "Selling Price (৳)",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                MediSyncButton(
                    text = "Add Stock",
                    isLoading = uiState.isLoading,
                    enabled = quantity.isNotBlank() && sellingPrice.isNotBlank(),
                    onClick = {
                        val qty = quantity.toIntOrNull() ?: 0
                        val cp = costPrice.toDoubleOrNull() ?: 0.0
                        val sp = sellingPrice.toDoubleOrNull() ?: 0.0
                        
                        viewModel.addStock(
                            drugId = selectedDrug!!.drugId,
                            quantity = qty,
                            batchNumber = batchNumber,
                            expiryDate = expiryDate,
                            costPrice = cp,
                            sellingPrice = sp,
                            onSuccess = {
                                Toast.makeText(context, "Stock added successfully", Toast.LENGTH_SHORT).show()
                                onNavigateBack()
                            },
                            onError = { err ->
                                Toast.makeText(context, err, Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                )
            }
        }
    }
}
