package com.medisync.android.presentation.pharmacy

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnPrimary
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    viewModel: PharmacyInventoryViewModel,
    onNavigateToUpdateStock: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var filterType by remember { mutableStateOf("All") }

    LaunchedEffect(Unit) {
        viewModel.loadInventory()
    }

    val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

    val inventory = uiState.inventory
    val totalItems = inventory.size
    val totalValue = inventory.sumOf { (it.quantity * (it.sellingPrice ?: 0.0)) }
    val lowStockCount = inventory.count { it.quantity < 20 }
    val expiredCount = inventory.count { it.expiryDate != null && it.expiryDate < todayStr }

    val filteredInventory = inventory.filter { item ->
        val matchesSearch = if (searchQuery.isNotBlank()) {
            item.drugName.contains(searchQuery, ignoreCase = true)
        } else true

        val matchesFilter = when (filterType) {
            "Low Stock" -> item.quantity < 20
            "Expired" -> item.expiryDate != null && item.expiryDate < todayStr
            else -> true
        }
        matchesSearch && matchesFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inventory", fontWeight = FontWeight.Bold) },
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
                onClick = onNavigateToUpdateStock,
                containerColor = PrimaryTeal,
                contentColor = OnPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Stock")
            }
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
                        Text("Total Items", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(totalItems.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Total Value", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text("৳$totalValue", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Low Stock", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(lowStockCount.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(140.dp)) {
                        Text("Expired", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(expiredCount.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            MediSyncTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = "Search",
                placeholder = "Search drug...",
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
                    selected = filterType == "Low Stock",
                    onClick = { filterType = "Low Stock" },
                    label = { Text("Low Stock") }
                )
                FilterChip(
                    selected = filterType == "Expired",
                    onClick = { filterType = "Expired" },
                    label = { Text("Expired") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredInventory.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("No inventory found", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredInventory, key = { it.inventoryId }) { item ->
                        ElevationCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.drugName,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    Text(
                                        text = item.manufacturer ?: "Unknown",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = OnSurfaceVariant
                                    )
                                }
                                
                                val qtyBadgeType = when {
                                    item.quantity < 20 -> BadgeType.URGENCY_HIGH
                                    item.quantity < 50 -> BadgeType.AI_ASSISTED
                                    else -> BadgeType.VERIFIED
                                }
                                StatusBadge(text = "${item.quantity} Units", type = qtyBadgeType)
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val expBadgeType = when {
                                    item.expiryDate == null -> BadgeType.EXTRACTED
                                    item.expiryDate < todayStr -> BadgeType.URGENCY_HIGH
                                    item.expiryDate < SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000)) -> BadgeType.AI_ASSISTED
                                    else -> BadgeType.EXTRACTED
                                }
                                StatusBadge(text = "Exp: ${item.expiryDate ?: "N/A"}", type = expBadgeType)
                                
                                Text(
                                    text = "৳${item.sellingPrice ?: 0.0}",
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryTeal,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
