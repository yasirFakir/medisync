package com.medisync.android.data.repository

import com.medisync.android.data.model.AppointmentDto
import com.medisync.android.data.model.BookAppointmentRequest
import com.medisync.android.data.model.DoctorDto

interface AppointmentsRepository {
    suspend fun getDoctors(city: String? = null, designation: String? = null, search: String? = null): Result<List<DoctorDto>>
    suspend fun getMyAppointments(): Result<List<AppointmentDto>>
    suspend fun bookAppointment(request: BookAppointmentRequest): Result<AppointmentDto>
    suspend fun updateAppointmentStatus(appointmentId: String, status: com.medisync.android.data.model.AppointmentStatus): Result<Boolean>
    suspend fun cancelAppointment(appointmentId: String): Result<Boolean>
}

