package com.medisync.android.presentation.appointments

import com.medisync.android.data.model.AppointmentDto
import com.medisync.android.data.model.DoctorDto

data class AppointmentsUiState(
    val doctors: List<DoctorDto> = emptyList(),
    val myAppointments: List<AppointmentDto> = emptyList(),
    val isLoading: Boolean = false,
    val selectedDoctor: DoctorDto? = null,
    val isBookingSuccess: Boolean = false,
    val searchQuery: String = "",
    val selectedCity: String = "All",
    val selectedDesignation: String = "All",
    val errorMessage: String? = null
)
