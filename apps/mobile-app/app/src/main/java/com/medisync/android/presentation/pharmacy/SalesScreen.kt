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
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesScreen(
    viewModel: PharmacyInventoryViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var filterType by remember { mutableStateOf("All") }

    LaunchedEffect(Unit) {
        viewModel.loadSales()
    }

    val summary = uiState.summary
    val sales = uiState.sales

    val filteredSales = sales.filter { sale ->
        val matchesSearch = if (searchQuery.isNotBlank()) {
            sale.invoiceNumber.contains(searchQuery, ignoreCase = true) ||
            (sale.customerName?.contains(searchQuery, ignoreCase = true) == true)
        } else true
        
        val matchesFilter = when (filterType) {
            "CASH" -> sale.paymentMethod == "CASH"
            "CARD" -> sale.paymentMethod == "CARD"
            "MOBILE" -> sale.paymentMethod == "MOBILE"
            else -> true
        }
        
        matchesSearch && matchesFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sales & Revenue", fontWeight = FontWeight.Bold) },
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
            
            Text("Today's Overview", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Revenue", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text("৳${summary.todayRevenue}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Profit", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text("৳${summary.todayProfit}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = PrimaryTeal)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Orders", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(summary.todayOrders.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            Text("This Month", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Revenue", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text("৳${summary.monthRevenue}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Profit", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text("৳${summary.monthProfit}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = PrimaryTeal)
                    }
                }
                item {
                    ElevationCard(modifier = Modifier.width(130.dp)) {
                        Text("Orders", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        Text(summary.monthOrders.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            MediSyncTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = "Search",
                placeholder = "Search invoice or customer...",
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
                    selected = filterType == "CASH",
                    onClick = { filterType = "CASH" },
                    label = { Text("CASH") }
                )
                FilterChip(
                    selected = filterType == "CARD",
                    onClick = { filterType = "CARD" },
                    label = { Text("CARD") }
                )
                FilterChip(
                    selected = filterType == "MOBILE",
                    onClick = { filterType = "MOBILE" },
                    label = { Text("MOBILE") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            if (filteredSales.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("No sales found", style = MaterialTheme.typography.bodyLarge, color = OnSurfaceVariant)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredSales, key = { it.saleId }) { sale ->
                        ElevationCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = sale.invoiceNumber,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = sale.createdAt,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(6.dp))
                            
                            Text(
                                text = sale.customerName ?: "Walk-in",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${sale.itemCount} items • ৳${sale.netTotal}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryTeal
                                )
                                
                                val pmtBadgeType = when(sale.paymentMethod) {
                                    "CASH" -> BadgeType.VERIFIED
                                    "CARD" -> BadgeType.AI_ASSISTED
                                    else -> BadgeType.EXTRACTED
                                }
                                StatusBadge(text = sale.paymentMethod, type = pmtBadgeType)
                            }
                        }
                    }
                }
            }
        }
    }
}
