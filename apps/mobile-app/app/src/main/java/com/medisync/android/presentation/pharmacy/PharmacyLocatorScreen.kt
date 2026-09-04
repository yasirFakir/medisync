package com.medisync.android.presentation.pharmacy

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.data.model.StockStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PharmacyLocatorScreen(
    drugId: String?,
    viewModel: PharmacyViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchInput by remember { mutableStateOf("") }

    LaunchedEffect(drugId) {
        if (drugId != null) {
            viewModel.loadAvailability(drugId)
        } else {
            viewModel.searchPharmacies()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (drugId != null) "Medicine Availability" else "Pharmacy Locator", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 20.dp)
        ) {
            MediSyncTextField(
                value = searchInput,
                onValueChange = {
                    searchInput = it
                    viewModel.searchPharmacies(it)
                },
                label = "Search Pharmacies or Area",
                placeholder = "e.g. Dhanmondi, Gulshan, Lazz",
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = PrimaryTeal)
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = PrimaryTeal)
                }
            } else if (drugId != null && uiState.availabilityResult != null) {
                // Availability View
                val result = uiState.availabilityResult!!
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 16.dp)
                ) {
                    item {
                        ElevationCard {
                            Text(
                                text = "Stock Summary for ${result.drug.brandName}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${result.summary.inStock} of ${result.summary.totalPharmacies} pharmacies have this medicine in stock.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = OnSurfaceVariant
                            )
                        }
                    }

                    items(result.pharmacies, key = { it.pharmacyId }) { item ->
                        ElevationCard {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = item.storeName, fontWeight = FontWeight.Bold)
                                    Text(text = "${item.streetAddress}, ${item.city}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                    item.currentPrice?.let {
                                        Text(text = "Price: ৳${"%.2f".format(it)} • Qty: ${item.quantity}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = PrimaryTeal)
                                    }
                                }
                                val badgeType = when (item.stockStatus) {
                                    StockStatus.IN_STOCK -> BadgeType.VERIFIED
                                    StockStatus.LOW_STOCK -> BadgeType.AI_ASSISTED
                                    StockStatus.OUT_OF_STOCK -> BadgeType.URGENCY_CRITICAL
                                }
                                StatusBadge(text = item.stockStatus.name.replace("_", " "), type = badgeType)
                            }
                        }
                    }
                }
            } else {
                // General Directory List
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 16.dp)
                ) {
                    items(uiState.pharmacies, key = { it.pharmacyId }) { pharmacy ->
                        ElevationCard {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = pharmacy.storeName, fontWeight = FontWeight.Bold)
                                    Text(text = "${pharmacy.streetAddress}, ${pharmacy.city}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                    pharmacy.contactPhone?.let {
                                        Text(text = "Tel: $it", style = MaterialTheme.typography.bodySmall, color = PrimaryTeal)
                                    }
                                }
                                if (pharmacy.isVerified) {
                                    StatusBadge(text = "Verified", type = BadgeType.VERIFIED)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
