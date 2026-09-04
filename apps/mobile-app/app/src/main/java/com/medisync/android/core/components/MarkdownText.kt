package com.medisync.android.core.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OutlineVariant
import com.medisync.android.core.theme.PrimaryTeal

@Composable
fun MarkdownText(
    markdown: String,
    modifier: Modifier = Modifier,
    color: Color = OnSurface
) {
    val lines = markdown.lines()

    Column(modifier = modifier) {
        lines.forEachIndexed { index, line ->
            val trimmed = line.trim()
            when {
                trimmed.startsWith("###") -> {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = parseInlineMarkdown(trimmed.removePrefix("###").trim()),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryTeal
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                }
                trimmed.startsWith("##") -> {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = parseInlineMarkdown(trimmed.removePrefix("##").trim()),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryTeal
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                trimmed.startsWith("#") -> {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = parseInlineMarkdown(trimmed.removePrefix("#").trim()),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryTeal
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                trimmed.startsWith("---") || trimmed.startsWith("***") -> {
                    Spacer(modifier = Modifier.height(6.dp))
                    HorizontalDivider(color = OutlineVariant, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(6.dp))
                }
                trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ") -> {
                    val content = trimmed.substring(2).trim()
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                    ) {
                        Text(
                            text = "•",
                            fontWeight = FontWeight.Bold,
                            color = PrimaryTeal,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = parseInlineMarkdown(content),
                            style = MaterialTheme.typography.bodyMedium,
                            color = color,
                            lineHeight = 20.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                trimmed.isNotEmpty() && trimmed[0].isDigit() && (trimmed.contains(". ") || trimmed.contains(") ")) -> {
                    val prefix = trimmed.substringBefore(" ").trim()
                    val content = trimmed.substringAfter(" ").trim()
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                    ) {
                        Text(
                            text = prefix,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryTeal,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(end = 6.dp)
                        )
                        Text(
                            text = parseInlineMarkdown(content),
                            style = MaterialTheme.typography.bodyMedium,
                            color = color,
                            lineHeight = 20.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                trimmed.isEmpty() -> {
                    Spacer(modifier = Modifier.height(4.dp))
                }
                else -> {
                    Text(
                        text = parseInlineMarkdown(trimmed),
                        style = MaterialTheme.typography.bodyMedium,
                        color = color,
                        lineHeight = 21.sp,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    }
}

fun parseInlineMarkdown(text: String): AnnotatedString {
    return buildAnnotatedString {
        var cursor = 0
        val length = text.length

        while (cursor < length) {
            if (cursor + 1 < length && text[cursor] == '*' && text[cursor + 1] == '*') {
                // Bold **
                val end = text.indexOf("**", cursor + 2)
                if (end != -1) {
                    withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                        append(text.substring(cursor + 2, end))
                    }
                    cursor = end + 2
                    continue
                }
            } else if (text[cursor] == '`') {
                // Inline code `
                val end = text.indexOf('`', cursor + 1)
                if (end != -1) {
                    withStyle(
                        SpanStyle(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Medium,
                            fontSize = 13.sp
                        )
                    ) {
                        append(text.substring(cursor + 1, end))
                    }
                    cursor = end + 1
                    continue
                }
            } else if (text[cursor] == '*' && (cursor == 0 || text[cursor - 1] != '*')) {
                // Italic *
                val end = text.indexOf('*', cursor + 1)
                if (end != -1 && (end + 1 >= length || text[end + 1] != '*')) {
                    withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
                        append(text.substring(cursor + 1, end))
                    }
                    cursor = end + 1
                    continue
                }
            }

            append(text[cursor])
            cursor++
        }
    }
}
