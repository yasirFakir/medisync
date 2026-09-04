package com.medisync.android.presentation.alternatives

import com.medisync.android.data.model.DrugComparisonDto
import com.medisync.android.data.model.DrugMasterDto
import com.medisync.android.data.model.ScoredAlternativeDto

data class AlternativesUiState(
    val isLoading: Boolean = false,
    val sourceDrug: DrugMasterDto? = null,
    val alternatives: List<ScoredAlternativeDto> = emptyList(),
    val selectedForComparison: Set<String> = emptySet(),
    val comparisonResult: List<DrugComparisonDto> = emptyList(),
    val isComparing: Boolean = false,
    val errorMessage: String? = null
)
