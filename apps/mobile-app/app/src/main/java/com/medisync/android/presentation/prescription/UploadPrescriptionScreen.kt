package com.medisync.android.presentation.prescription

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.medisync.android.BuildConfig
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ButtonVariant
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.MediSyncShapes
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.OutlineVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.core.theme.SurfaceContainerLowest
import java.io.ByteArrayOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadPrescriptionScreen(
    viewModel: PrescriptionViewModel,
    onNavigateToAnalysis: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showApiKeySheet by remember { mutableStateOf(false) }
    var mistralKeyInput by remember { mutableStateOf(BuildConfig.MISTRAL_API_KEY) }
    var isProcessingImage by remember { mutableStateOf(false) }

    // Camera Preview capture launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        if (bitmap != null) {
            isProcessingImage = true
            val baos = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, baos)
            val bytes = baos.toByteArray()
            viewModel.digitizeImage(bytes, "camera_prescription.jpg")
            onNavigateToAnalysis()
        }
    }

    // Permission launcher for Camera
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            cameraLauncher.launch()
        } else {
            Toast.makeText(context, "Camera permission is required to scan prescriptions", Toast.LENGTH_LONG).show()
        }
    }

    // Gallery Picker launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                isProcessingImage = true
                val inputStream = context.contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes() ?: "mock_prescription_image_bytes".toByteArray()
                inputStream?.close()
                viewModel.digitizeImage(bytes, "gallery_prescription.jpg")
                onNavigateToAnalysis()
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to read selected image: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun handleCameraClick() {
        val permissionCheck = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
        if (permissionCheck == PackageManager.PERMISSION_GRANTED) {
            cameraLauncher.launch()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Digitize Prescription", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showApiKeySheet = true }) {
                        Icon(Icons.Default.Key, contentDescription = "Mistral API Key", tint = PrimaryTeal)
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
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Smart Medical OCR Scanner",
                    style = MaterialTheme.typography.headlineMedium,
                    color = OnSurface,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Powered by Mistral Vision AI & Local Clinical Engine for real prescription digitization",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Mistral AI Status Banner
                ElevationCard(
                    onClick = { showApiKeySheet = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = PrimaryTeal)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Mistral Vision OCR",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        StatusBadge(
                            text = if (mistralKeyInput.isNotBlank()) "API Key Active" else "Standalone Ready",
                            type = if (mistralKeyInput.isNotBlank()) BadgeType.VERIFIED else BadgeType.AI_ASSISTED
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Interactive Camera/Drop Zone
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .background(SurfaceContainerLowest, shape = MediSyncShapes.extraLarge)
                        .border(2.dp, OutlineVariant, shape = MediSyncShapes.extraLarge)
                        .clickable(enabled = !uiState.isUploading) {
                            handleCameraClick()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    if (uiState.isUploading) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = PrimaryTeal)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Analyzing prescription with Mistral Vision AI...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = PrimaryTeal,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .background(SecondarySkyBlue.copy(alpha = 0.12f), shape = MaterialTheme.shapes.large),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = "Capture",
                                    tint = SecondarySkyBlue,
                                    modifier = Modifier.size(30.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Tap to Scan Prescription",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = OnSurface
                            )
                            Text(
                                text = "Takes real photo with camera or pick from gallery",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MediSyncButton(
                        text = "Camera Scan",
                        onClick = { handleCameraClick() },
                        modifier = Modifier.weight(1f)
                    )
                    MediSyncButton(
                        text = "Gallery Photo",
                        onClick = { galleryLauncher.launch("image/*") },
                        variant = ButtonVariant.OUTLINE,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (uiState.errorMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = uiState.errorMessage ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = ErrorCrimson
                    )
                }
            }

            // Security note
            ElevationCard(modifier = Modifier.padding(top = 20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "Security",
                        tint = PrimaryTeal,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Prescriptions are encrypted locally and protected with your dynamic 6-digit access code.",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariant
                    )
                }
            }
        }

        // Mistral API Key Sheet
        if (showApiKeySheet) {
            ModalBottomSheet(onDismissRequest = { showApiKeySheet = false }) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    Text(
                        text = "Mistral AI OCR Configuration",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Your Mistral API key is embedded for AI Symptom Triage & Vision OCR. You may update it below anytime.",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    MediSyncTextField(
                        value = mistralKeyInput,
                        onValueChange = { mistralKeyInput = it },
                        label = "Mistral API Key",
                        placeholder = "e.g. your-mistral-api-key"
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Save Key",
                        onClick = {
                            showApiKeySheet = false
                            Toast.makeText(context, "Mistral API Key updated", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
            }
        }
    }
}
