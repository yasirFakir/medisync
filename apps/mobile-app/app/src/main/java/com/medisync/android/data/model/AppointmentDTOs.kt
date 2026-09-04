package com.medisync.android.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class AppointmentStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED
}

@Serializable
data class DoctorSlotDto(
    val slotId: String? = null,
    val locationName: String? = "Main Chamber",
    val address: String? = null,
    val startTime: String? = "18:00",
    val endTime: String? = "21:00",
    val dayOfWeek: List<Int>? = null,
    val specificDates: List<String>? = null
)

@Serializable
data class DoctorDto(
    val doctorId: String,
    val fullName: String,
    val designation: String = "General Physician",
    val specialization: String = "Internal Medicine",
    val qualifications: String? = "MBBS, FCPS",
    val bio: String? = null,
    val consultationFee: Double = 500.0,
    val experienceYears: Int = 5,
    val area: String? = "Dhanmondi",
    val city: String? = "Dhaka",
    val avatarUrl: String? = null,
    val rating: Double = 5.0,
    val totalReviews: Int = 0,
    val slots: List<DoctorSlotDto> = emptyList()
)

@Serializable
data class AppointmentDto(
    val appointmentId: String,
    val patientId: String? = null,
    val doctorId: String,
    val appointmentDate: String,
    val startTime: String,
    val endTime: String,
    val locationName: String? = "Main Chamber",
    val status: AppointmentStatus = AppointmentStatus.PENDING,
    val reason: String? = null,
    val patientName: String? = null,
    val doctorName: String? = null,
    val designation: String? = null,
    val specialization: String? = null
)

@Serializable
data class BookAppointmentRequest(
    val doctorId: String,
    val slotId: String? = null,
    val appointmentDate: String,
    val startTime: String,
    val endTime: String,
    val locationName: String = "Main Chamber",
    val reason: String? = null
)
