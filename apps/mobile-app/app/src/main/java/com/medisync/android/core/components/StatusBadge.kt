package com.medisync.android.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medisync.android.core.theme.BadgeAiBg
import com.medisync.android.core.theme.BadgeAiText
import com.medisync.android.core.theme.BadgeExtractedBg
import com.medisync.android.core.theme.BadgeExtractedText
import com.medisync.android.core.theme.BadgeVerifiedBg
import com.medisync.android.core.theme.BadgeVerifiedText
import com.medisync.android.core.theme.ErrorContainer
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.PillShape

enum class BadgeType {
    VERIFIED,
    EXTRACTED,
    AI_ASSISTED,
    URGENCY_LOW,
    URGENCY_MEDIUM,
    URGENCY_HIGH,
    URGENCY_CRITICAL
}

@Composable
fun StatusBadge(
    text: String,
    type: BadgeType,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (type) {
        BadgeType.VERIFIED -> Pair(BadgeVerifiedBg, BadgeVerifiedText)
        BadgeType.EXTRACTED -> Pair(BadgeExtractedBg, BadgeExtractedText)
        BadgeType.AI_ASSISTED -> Pair(BadgeAiBg, BadgeAiText)
        BadgeType.URGENCY_LOW -> Pair(BadgeVerifiedBg, BadgeVerifiedText)
        BadgeType.URGENCY_MEDIUM -> Pair(BadgeAiBg, BadgeAiText)
        BadgeType.URGENCY_HIGH -> Pair(Color(0xFFFFEDD5), Color(0xFFC2410C))
        BadgeType.URGENCY_CRITICAL -> Pair(ErrorContainer, ErrorCrimson)
    }

    Box(
        modifier = modifier
            .clip(PillShape)
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.Bold
        )
    }
}
