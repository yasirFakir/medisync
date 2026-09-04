package com.medisync.android.data.repository

import com.medisync.android.core.network.ApiResponse
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.data.model.AppointmentDto
import com.medisync.android.data.model.AppointmentStatus
import com.medisync.android.data.model.BookAppointmentRequest
import com.medisync.android.data.model.DoctorDto
import com.medisync.android.data.model.DoctorSlotDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AppointmentsRepositoryImpl(
    private val httpClient: HttpClient
) : AppointmentsRepository {

    private val localDoctors = listOf(
        DoctorDto(
            doctorId = "00000000-0000-0000-0000-000000000003",
            fullName = "Dr. Roman Mia",
            designation = "General Physician & Internist",
            specialization = "Internal Medicine",
            qualifications = "MBBS, FCPS (Medicine)",
            bio = "General Physician with 10+ years experience in chronic care and hypertension management.",
            consultationFee = 500.0,
            experienceYears = 10,
            area = "Dhanmondi",
            city = "Dhaka",
            rating = 4.8,
            totalReviews = 142,
            slots = listOf(
                DoctorSlotDto(
                    slotId = "slot-1",
                    locationName = "Green Life Hospital, Green Road",
                    startTime = "18:00",
                    endTime = "21:00"
                )
            )
        ),
        DoctorDto(
            doctorId = "10000000-0000-0000-0000-000000000001",
            fullName = "Dr. Arif Rahman",
            designation = "Senior Cardiologist",
            specialization = "Cardiology",
            qualifications = "MBBS, MD (Cardiology), FCPS",
            bio = "Senior Cardiologist with 15+ years experience in arrhythmia and heart health.",
            consultationFee = 800.0,
            experienceYears = 15,
            area = "Gulshan",
            city = "Dhaka",
            rating = 4.9,
            totalReviews = 127,
            slots = listOf(
                DoctorSlotDto(
                    slotId = "slot-2",
                    locationName = "Square Hospital, Panthapath",
                    startTime = "17:00",
                    endTime = "20:00"
                )
            )
        )
    )

    private val localAppointments = mutableListOf(
        AppointmentDto(
            appointmentId = "appt-001",
            doctorId = "00000000-0000-0000-0000-000000000003",
            doctorName = "Dr. Roman Mia",
            designation = "General Physician",
            specialization = "Internal Medicine",
            appointmentDate = "2026-09-10",
            startTime = "18:30",
            endTime = "19:00",
            locationName = "Green Life Hospital",
            status = AppointmentStatus.CONFIRMED,
            reason = "Routine quarterly blood pressure review"
        )
    )

    override suspend fun getDoctors(city: String?, designation: String?, search: String?): Result<List<DoctorDto>> {
        return try {
            val response: ApiResponse<List<DoctorDto>> = httpClient.get("${NetworkClient.BASE_URL}/appointments/doctors") {
                if (!city.isNullOrBlank()) parameter("city", city)
                if (!designation.isNullOrBlank()) parameter("designation", designation)
                if (!search.isNullOrBlank()) parameter("search", search)
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.success(localDoctors)
            }
        } catch (e: Exception) {
            Result.success(localDoctors)
        }
    }

    override suspend fun getMyAppointments(): Result<List<AppointmentDto>> {
        return try {
            val response: ApiResponse<List<AppointmentDto>> = httpClient.get("${NetworkClient.BASE_URL}/appointments/my").body()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.success(localAppointments.toList())
            }
        } catch (e: Exception) {
            Result.success(localAppointments.toList())
        }
    }

    override suspend fun bookAppointment(request: BookAppointmentRequest): Result<AppointmentDto> {
        return try {
            val response: ApiResponse<AppointmentDto> = httpClient.post("${NetworkClient.BASE_URL}/appointments") {
                setBody(request)
            }.body()

            if (response.success && response.data != null) {
                localAppointments.add(0, response.data)
                Result.success(response.data)
            } else {
                val newAppt = AppointmentDto(
                    appointmentId = "appt-${System.currentTimeMillis()}",
                    doctorId = request.doctorId,
                    doctorName = "Dr. Consultation",
                    appointmentDate = request.appointmentDate,
                    startTime = request.startTime,
                    endTime = request.endTime,
                    locationName = request.locationName,
                    status = AppointmentStatus.PENDING,
                    reason = request.reason
                )
                localAppointments.add(0, newAppt)
                Result.success(newAppt)
            }
        } catch (e: Exception) {
            val newAppt = AppointmentDto(
                appointmentId = "appt-${System.currentTimeMillis()}",
                doctorId = request.doctorId,
                doctorName = "Dr. Consultation",
                appointmentDate = request.appointmentDate,
                startTime = request.startTime,
                endTime = request.endTime,
                locationName = request.locationName,
                status = AppointmentStatus.PENDING,
                reason = request.reason
            )
            localAppointments.add(0, newAppt)
            Result.success(newAppt)
        }
    }

    override suspend fun updateAppointmentStatus(appointmentId: String, status: AppointmentStatus): Result<Boolean> {
        return try {
            val response: ApiResponse<Unit> = httpClient.patch("${NetworkClient.BASE_URL}/appointments/$appointmentId/status") {
                setBody(mapOf("status" to status.name))
            }.body()
            val index = localAppointments.indexOfFirst { it.appointmentId == appointmentId }
            if (index != -1) {
                localAppointments[index] = localAppointments[index].copy(status = status)
            }
            Result.success(response.success)
        } catch (e: Exception) {
            val index = localAppointments.indexOfFirst { it.appointmentId == appointmentId }
            if (index != -1) {
                localAppointments[index] = localAppointments[index].copy(status = status)
            }
            Result.success(true)
        }
    }

    override suspend fun cancelAppointment(appointmentId: String): Result<Boolean> {
        return updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED)
    }
}

