package com.medisync.android.core.util

/**
 * Utility functions for string formatting across MediSync Android.
 */

fun formatDoctorName(rawName: String?): String {
    if (rawName.isNullOrBlank()) return "Dr. Unknown"
    val cleaned = rawName.trim().replace(Regex("""^(?:\s*dr\.?\s*)+""", RegexOption.IGNORE_CASE), "")
    return if (cleaned.isNotBlank()) "Dr. $cleaned" else "Dr. Unknown"
}
