package com.medisync.android.presentation.alternatives

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CompareArrows
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ButtonVariant
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlternativesScreen(
    drugId: String,
    viewModel: AlternativesViewModel,
    onNavigateToAvailability: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showComparisonSheet by remember { mutableStateOf(false) }

    LaunchedEffect(drugId) {
        viewModel.loadAlternatives(drugId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Generic Alternatives", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CanvasBackground)
            )
        },
        bottomBar = {
            if (uiState.selectedForComparison.size >= 2) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CanvasBackground)
                        .padding(16.dp)
                ) {
                    MediSyncButton(
                        text = "Compare Selected (${uiState.selectedForComparison.size})",
                        onClick = {
                            viewModel.compareSelected()
                            showComparisonSheet = true
                        }
                    )
                }
            }
        },
        containerColor = CanvasBackground
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = PrimaryTeal)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 16.dp)
            ) {
                // Source Drug Card
                uiState.sourceDrug?.let { source ->
                    item {
                        ElevationCard {
                            Text(
                                text = "Prescribed Brand (Source)",
                                style = MaterialTheme.typography.labelSmall,
                                color = OnSurfaceVariant,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = source.brandName,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "৳${"%.2f".format(source.estimatedPrice)}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = OnSurface
                                )
                            }
                            Text(
                                text = source.saltComposition,
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                        }
                    }
                }

                item {
                    Text(
                        text = "Ranked Bioequivalent Alternatives (${uiState.alternatives.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                items(uiState.alternatives, key = { it.drugId }) { alternative ->
                    val isSelected = uiState.selectedForComparison.contains(alternative.drugId)
                    ElevationCard {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = alternative.brandName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    StatusBadge(text = "${alternative.score.toInt()}% Match", type = BadgeType.VERIFIED)
                                }
                                Text(
                                    text = alternative.manufacturer ?: "Pharmaceuticals Ltd",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "৳${"%.2f".format(alternative.estimatedPrice)}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryTeal
                                )
                                if (alternative.matchDetails.priceDifferencePercent < 0) {
                                    Text(
                                        text = "${"%.1f".format(-alternative.matchDetails.priceDifferencePercent)}% Cheaper",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = PrimaryTeal,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.toggleSelectionForComparison(alternative.drugId) },
                                label = { Text(if (isSelected) "Selected" else "+ Compare", fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = PrimaryTeal,
                                    selectedLabelColor = Color.White
                                )
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            MediSyncButton(
                                text = "Check Stock",
                                onClick = { onNavigateToAvailability(alternative.drugId) },
                                variant = ButtonVariant.OUTLINE,
                                modifier = Modifier.width(130.dp).height(40.dp)
                            )
                        }
                    }
                }
            }
        }

        // Side-by-side comparison modal bottom sheet
        if (showComparisonSheet && uiState.comparisonResult.isNotEmpty()) {
            ModalBottomSheet(
                onDismissRequest = { showComparisonSheet = false },
                sheetState = rememberModalBottomSheetState()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "Side-by-Side Drug Comparison",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    uiState.comparisonResult.forEach { item ->
                        ElevationCard(modifier = Modifier.padding(bottom = 10.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(text = item.brandName, fontWeight = FontWeight.Bold)
                                Text(text = "৳${"%.2f".format(item.estimatedPrice)}", color = PrimaryTeal, fontWeight = FontWeight.Bold)
                            }
                            Text(text = "Generic: ${item.genericName}", style = MaterialTheme.typography.bodySmall)
                            Text(text = "Uses: ${item.uses ?: "General Therapeutics"}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    MediSyncButton(
                        text = "Close Comparison",
                        onClick = { showComparisonSheet = false }
                    )
                }
            }
        }
    }
}
