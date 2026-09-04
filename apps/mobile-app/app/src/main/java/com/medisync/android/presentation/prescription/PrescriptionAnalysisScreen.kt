package com.medisync.android.presentation.prescription

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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocalPharmacy
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ButtonVariant
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.rag.MedicineMatchingEngine
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.data.model.PrescriptionMedicineDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrescriptionAnalysisScreen(
    viewModel: PrescriptionViewModel,
    onSaveSuccess: () -> Unit,
    onNavigateToAlternatives: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Prescription Review & RAG", fontWeight = FontWeight.Bold) },
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 16.dp)
        ) {
            item {
                ElevationCard {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Extracted Doctor Details",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        StatusBadge(text = "OCR + RAG Verified", type = BadgeType.VERIFIED)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = uiState.doctorName,
                        onValueChange = { viewModel.updateDoctorName(it) },
                        label = "Doctor Name"
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    MediSyncTextField(
                        value = uiState.digitizedNotes,
                        onValueChange = { viewModel.updateNotes(it) },
                        label = "Clinical Notes / Diagnosis"
                    )
                }
            }

            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(
                            text = "Matched Medicines (${uiState.detectedMedicines.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Grounded against Master Drug Catalog",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                    IconButton(
                        onClick = {
                            viewModel.addMedicine(
                                PrescriptionMedicineDto(
                                    brandName = "Napa Extra",
                                    saltComposition = "Paracetamol + Caffeine",
                                    dosage = "500mg/65mg",
                                    frequency = "1+0+1",
                                    duration = "5 days"
                                )
                            )
                        }
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add Medicine", tint = PrimaryTeal)
                    }
                }
            }

            itemsIndexed(uiState.detectedMedicines) { index, medicine ->
                val matchResult = MedicineMatchingEngine.matchSingleMedicine(medicine)

                ElevationCard {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(PrimaryTeal.copy(alpha = 0.1f), shape = MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.LocalPharmacy, contentDescription = null, tint = PrimaryTeal)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = matchResult.normalizedBrand,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                StatusBadge(
                                    text = when (matchResult.matchType) {
                                        com.medisync.android.core.rag.MatchType.EXACT_BRAND -> "Verified Brand"
                                        com.medisync.android.core.rag.MatchType.FUZZY_BRAND -> "Fuzzy Matched"
                                        com.medisync.android.core.rag.MatchType.EXACT_GENERIC -> "Generic Match"
                                        com.medisync.android.core.rag.MatchType.FUZZY_GENERIC -> "Generic Match"
                                        com.medisync.android.core.rag.MatchType.UNKNOWN -> "Custom Entry"
                                    },
                                    type = when (matchResult.matchType) {
                                        com.medisync.android.core.rag.MatchType.EXACT_BRAND -> BadgeType.VERIFIED
                                        com.medisync.android.core.rag.MatchType.FUZZY_BRAND -> BadgeType.AI_ASSISTED
                                        com.medisync.android.core.rag.MatchType.EXACT_GENERIC -> BadgeType.VERIFIED
                                        com.medisync.android.core.rag.MatchType.FUZZY_GENERIC -> BadgeType.AI_ASSISTED
                                        com.medisync.android.core.rag.MatchType.UNKNOWN -> BadgeType.EXTRACTED
                                    }
                                )
                            }
                            Text(
                                text = "Generic: ${matchResult.verifiedSaltComposition}",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                            if (matchResult.matchedDrug != null) {
                                Text(
                                    text = "Mfg: ${matchResult.matchedDrug.manufacturer} • Est. Price: ৳${matchResult.matchedDrug.estimatedPrice}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = SecondarySkyBlue
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Schedule: ${medicine.frequency} (${medicine.dosage}) • ${medicine.duration}",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = PrimaryTeal
                            )
                        }
                        IconButton(onClick = { viewModel.removeMedicine(index) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorCrimson)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    MediSyncButton(
                        text = "Find Bioequivalent Alternatives",
                        onClick = { onNavigateToAlternatives(medicine.brandName) },
                        variant = ButtonVariant.OUTLINE,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(10.dp))
                MediSyncButton(
                    text = "Save to Digital Prescription Wallet",
                    isLoading = uiState.isLoading,
                    onClick = { viewModel.savePrescription(onSaveSuccess) }
                )
            }
        }
    }
}
