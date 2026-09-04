package com.medisync.android.core.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medisync.android.core.theme.MediSyncShapes
import com.medisync.android.core.theme.OnPrimary
import com.medisync.android.core.theme.Outline
import com.medisync.android.core.theme.PrimaryTeal

enum class ButtonVariant {
    PRIMARY,
    SECONDARY,
    OUTLINE
}

@Composable
fun MediSyncButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.PRIMARY,
    enabled: Boolean = true,
    isLoading: Boolean = false
) {
    val buttonModifier = modifier
        .fillMaxWidth()
        .height(52.dp)

    if (variant == ButtonVariant.PRIMARY) {
        Button(
            onClick = onClick,
            modifier = buttonModifier,
            enabled = enabled && !isLoading,
            shape = MediSyncShapes.small,
            colors = ButtonDefaults.buttonColors(
                containerColor = PrimaryTeal,
                contentColor = OnPrimary,
                disabledContainerColor = PrimaryTeal.copy(alpha = 0.5f),
                disabledContentColor = OnPrimary.copy(alpha = 0.7f)
            )
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = OnPrimary,
                    strokeWidth = 2.5.dp
                )
            } else {
                Text(
                    text = text,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    } else {
        OutlinedButton(
            onClick = onClick,
            modifier = buttonModifier,
            enabled = enabled && !isLoading,
            shape = MediSyncShapes.small,
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = PrimaryTeal
            )
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = PrimaryTeal,
                    strokeWidth = 2.5.dp
                )
            } else {
                Text(
                    text = text,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
