package com.medisync.android.presentation.appointments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medisync.android.data.model.BookAppointmentRequest
import com.medisync.android.data.model.DoctorDto
import com.medisync.android.data.repository.AppointmentsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AppointmentsViewModel(
    private val appointmentsRepository: AppointmentsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AppointmentsUiState())
    val uiState: StateFlow<AppointmentsUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        loadDoctors()
        loadMyAppointments()
    }

    fun loadDoctors() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val city = if (_uiState.value.selectedCity == "All") null else _uiState.value.selectedCity
            val designation = if (_uiState.value.selectedDesignation == "All") null else _uiState.value.selectedDesignation
            val query = _uiState.value.searchQuery.ifBlank { null }

            val result = appointmentsRepository.getDoctors(city, designation, query)
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(doctors = list, isLoading = false) }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.message) }
                }
            )
        }
    }

    fun loadMyAppointments() {
        viewModelScope.launch {
            val result = appointmentsRepository.getMyAppointments()
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(myAppointments = list) }
                },
                onFailure = { }
            )
        }
    }

    fun updateSearch(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadDoctors()
    }

    fun selectCity(city: String) {
        _uiState.update { it.copy(selectedCity = city) }
        loadDoctors()
    }

    fun selectDesignation(designation: String) {
        _uiState.update { it.copy(selectedDesignation = designation) }
        loadDoctors()
    }

    fun selectDoctor(doctor: DoctorDto?) {
        _uiState.update { it.copy(selectedDoctor = doctor, isBookingSuccess = false) }
    }

    fun bookAppointment(
        doctorId: String,
        slotId: String?,
        date: String,
        startTime: String,
        endTime: String,
        locationName: String,
        reason: String?,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val request = BookAppointmentRequest(
                doctorId = doctorId,
                slotId = slotId,
                appointmentDate = date,
                startTime = startTime,
                endTime = endTime,
                locationName = locationName,
                reason = reason
            )
            val result = appointmentsRepository.bookAppointment(request)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isBookingSuccess = true, selectedDoctor = null) }
                    loadMyAppointments()
                    onSuccess()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.message ?: "Booking failed") }
                }
            )
        }
    }

    fun updateAppointmentStatus(appointmentId: String, status: com.medisync.android.data.model.AppointmentStatus) {
        viewModelScope.launch {
            appointmentsRepository.updateAppointmentStatus(appointmentId, status)
            loadMyAppointments()
        }
    }

    fun cancelAppointment(appointmentId: String) {
        viewModelScope.launch {
            appointmentsRepository.cancelAppointment(appointmentId)
            loadMyAppointments()
        }
    }
}

