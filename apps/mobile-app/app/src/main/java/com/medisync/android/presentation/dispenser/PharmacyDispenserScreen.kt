package com.medisync.android.presentation.dispenser

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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocalPharmacy
import androidx.compose.material.icons.filled.Receipt
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
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PharmacyDispenserScreen(
    viewModel: DispenserViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pharmacy Dispenser & POS", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            if (uiState.completedReceipt != null) {
                // Receipt view
                val receipt = uiState.completedReceipt!!
                ElevationCard {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Success",
                            tint = PrimaryTeal,
                            modifier = Modifier.size(52.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Prescription Dispensed Successfully",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryTeal
                        )
                        Text(
                            text = "Invoice Number: ${receipt.invoiceNumber}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "Subtotal:", color = OnSurfaceVariant)
                            Text(text = "৳${"%.2f".format(receipt.subtotal)}", fontWeight = FontWeight.SemiBold)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "Discount:", color = OnSurfaceVariant)
                            Text(text = "-৳${"%.2f".format(receipt.discountAmount)}", color = PrimaryTeal)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "Net Amount Paid:", fontWeight = FontWeight.Bold)
                            Text(text = "৳${"%.2f".format(receipt.netTotal)}", fontWeight = FontWeight.Bold, color = PrimaryTeal)
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        MediSyncButton(
                            text = "New Dispensing Session",
                            onClick = { viewModel.reset() }
                        )
                    }
                }
            } else if (!uiState.isOtpVerified) {
                // OTP Unlock Form
                ElevationCard {
                    Text(
                        text = "Patient OTP Verification Gate",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Enter the patient's registered email or ID and their 6-digit access code.",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    MediSyncTextField(
                        value = uiState.patientEmailOrId,
                        onValueChange = { viewModel.updatePatientQuery(it) },
                        label = "Patient Email / Phone",
                        placeholder = "patient@medisync.com"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = uiState.otpInput,
                        onValueChange = { viewModel.updateOtp(it) },
                        label = "6-Digit Access Code",
                        placeholder = "e.g. 481920"
                    )

                    if (uiState.errorMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = uiState.errorMessage ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = ErrorCrimson
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Verify OTP & Unlock Prescriptions",
                        isLoading = uiState.isLoading,
                        onClick = { viewModel.verifyOtpAndLoadPrescriptions() }
                    )
                }
            } else {
                // Prescriptions to dispense
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Unlocked Prescription Items",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(text = "OTP Verified", type = BadgeType.VERIFIED)
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.itemsToDispense, key = { it.inventoryId }) { item ->
                        ElevationCard {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = item.medicineName, fontWeight = FontWeight.Bold)
                                    Text(text = "Schedule: ${item.dosageSchedule} • Qty: ${item.quantity}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariant)
                                }
                                Text(
                                    text = "৳${"%.2f".format(item.unitPrice * item.quantity)}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryTeal
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                MediSyncButton(
                    text = "Complete Sale & Deduct Inventory",
                    isLoading = uiState.isLoading,
                    onClick = { viewModel.finalizeSaleAndDispense("CASH") }
                )
            }
        }
    }
}
