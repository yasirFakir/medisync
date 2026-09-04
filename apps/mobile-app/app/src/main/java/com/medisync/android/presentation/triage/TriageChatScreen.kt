package com.medisync.android.presentation.triage

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MarkdownText
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnPrimary
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.OutlineVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.core.theme.SurfaceContainerLowest
import com.medisync.android.data.model.UrgencyLevel

private val COMMON_SYMPTOMS = listOf(
    "Fever",
    "Headache",
    "Chest Pain",
    "Sore Throat",
    "Cough",
    "Shortness of Breath",
    "Dizziness",
    "Fatigue"
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TriageChatScreen(
    viewModel: TriageViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var inputQuery by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "AI Symptom Triage",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = "Guardrailed",
                                tint = PrimaryTeal,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = "Clinical Medical Assistant • Guardrailed",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.resetSession() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "New Session", tint = PrimaryTeal)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CanvasBackground)
            )
        },
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .imePadding()
        ) {
            // Symptom Chips Carousel
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceContainerLowest)
                    .padding(vertical = 8.dp)
            ) {
                Text(
                    text = "Tap symptoms to add to context:",
                    style = MaterialTheme.typography.labelSmall,
                    color = OnSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp)
                )
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp)
                ) {
                    items(COMMON_SYMPTOMS) { symptom ->
                        val isSelected = uiState.selectedSymptoms.contains(symptom)
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.toggleSymptom(symptom) },
                            label = { Text(symptom, fontSize = 13.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (symptom == "Chest Pain") ErrorCrimson else PrimaryTeal,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            // Message Stream
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 12.dp)
            ) {
                items(uiState.messages, key = { it.id }) { message ->
                    ChatMessageBubble(message = message)
                }

                if (uiState.isLoading) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(8.dp)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = PrimaryTeal,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Evaluating symptoms with Mistral AI...",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Bottom Input Bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceContainerLowest)
                    .navigationBarsPadding()
                    .padding(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = inputQuery,
                        onValueChange = { inputQuery = it },
                        modifier = Modifier.weight(1f),
                        placeholder = {
                            Text(
                                text = if (uiState.selectedSymptoms.isNotEmpty()) "Add extra details..." else "Describe your symptoms...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = OnSurfaceVariant.copy(alpha = 0.6f)
                            )
                        },
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CanvasBackground,
                            unfocusedContainerColor = CanvasBackground,
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = OutlineVariant
                        ),
                        maxLines = 3
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (inputQuery.isNotBlank() || uiState.selectedSymptoms.isNotEmpty()) {
                                viewModel.sendMessage(inputQuery)
                                inputQuery = ""
                            }
                        },
                        enabled = !uiState.isLoading && (inputQuery.isNotBlank() || uiState.selectedSymptoms.isNotEmpty()),
                        modifier = Modifier
                            .size(48.dp)
                            .background(PrimaryTeal, shape = RoundedCornerShape(50))
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = OnPrimary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatMessageBubble(message: UiChatMessage) {
    val isUser = message.role == "user"

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        if (isUser) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                    .background(PrimaryTeal)
                    .padding(14.dp)
            ) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnPrimary
                )
            }
        } else {
            ElevationCard(
                modifier = Modifier.fillMaxWidth(0.95f)
            ) {
                if (message.urgencyLevel != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "AI Clinical Assessment",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                        val badgeType = when (message.urgencyLevel) {
                            UrgencyLevel.CRITICAL -> BadgeType.URGENCY_CRITICAL
                            UrgencyLevel.HIGH -> BadgeType.URGENCY_HIGH
                            UrgencyLevel.MEDIUM -> BadgeType.URGENCY_MEDIUM
                            UrgencyLevel.LOW -> BadgeType.URGENCY_LOW
                        }
                        StatusBadge(
                            text = "URGENCY: ${message.urgencyLevel.name}",
                            type = badgeType
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Render formatted Markdown content
                MarkdownText(
                    markdown = message.content,
                    modifier = Modifier.fillMaxWidth()
                )

                if (message.recommendedAction != null) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CanvasBackground, shape = MaterialTheme.shapes.small)
                            .padding(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "Recommendation",
                                tint = PrimaryTeal,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = message.recommendedAction,
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = PrimaryTeal
                            )
                        }
                    }
                }
            }
        }
    }
}
