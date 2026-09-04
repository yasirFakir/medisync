package com.medisync.android.presentation.appointments

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ElevationCard
import com.medisync.android.core.components.MediSyncButton
import com.medisync.android.core.components.MediSyncTextField
import com.medisync.android.core.components.StatusBadge
import com.medisync.android.core.theme.CanvasBackground
import com.medisync.android.core.theme.ErrorCrimson
import com.medisync.android.core.theme.OnSurface
import com.medisync.android.core.theme.OnSurfaceVariant
import com.medisync.android.core.theme.PrimaryTeal
import com.medisync.android.core.theme.SecondarySkyBlue
import com.medisync.android.data.model.AppointmentDto
import com.medisync.android.data.model.AppointmentStatus
import com.medisync.android.data.model.DoctorDto
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentsScreen(
    viewModel: AppointmentsViewModel,
    userRole: com.medisync.android.data.model.UserRole = com.medisync.android.data.model.UserRole.PATIENT,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(if (userRole == com.medisync.android.data.model.UserRole.DOCTOR) 1 else 0) }
    val context = LocalContext.current

    var showBookingSheet by remember { mutableStateOf(false) }
    var bookingDate by remember { mutableStateOf(LocalDate.now().plusDays(1).toString()) }
    var bookingTime by remember { mutableStateOf("18:30") }
    var bookingReason by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (userRole == com.medisync.android.data.model.UserRole.DOCTOR) "Doctor Appointment Schedule"
                        else "Book Doctor Appointment",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CanvasBackground)
            )
        },
        containerColor = CanvasBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (userRole == com.medisync.android.data.model.UserRole.DOCTOR) {
                // ── Doctor View: Chamber Schedule only (no Find Doctors tab) ──
                if (uiState.myAppointments.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No appointments scheduled",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Patients will appear here once they book a consultation with you.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = OnSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.myAppointments, key = { it.appointmentId }) { appointment ->
                            AppointmentCard(
                                appointment = appointment,
                                userRole = userRole,
                                onStatusChange = { newStatus ->
                                    viewModel.updateAppointmentStatus(appointment.appointmentId, newStatus)
                                    val toastMsg = when (newStatus) {
                                        AppointmentStatus.CONFIRMED -> "Appointment confirmed!"
                                        AppointmentStatus.COMPLETED -> "Consultation marked completed!"
                                        AppointmentStatus.CANCELLED -> "Appointment cancelled."
                                        else -> "Status updated."
                                    }
                                    Toast.makeText(context, toastMsg, Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }
            } else {
                // ── Patient View: Find Doctors + My Bookings tabs ──
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = CanvasBackground,
                    contentColor = PrimaryTeal,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = PrimaryTeal
                        )
                    }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Find Doctors (${uiState.doctors.size})", fontWeight = FontWeight.SemiBold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = {
                            selectedTab = 1
                            viewModel.loadMyAppointments()
                        },
                        text = {
                            Text(
                                "My Bookings (${uiState.myAppointments.size})",
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    )
                }

                if (selectedTab == 0) {
                    // Find Doctors Tab
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp, vertical = 12.dp)
                    ) {
                        MediSyncTextField(
                            value = uiState.searchQuery,
                            onValueChange = { viewModel.updateSearch(it) },
                            label = "Search by Doctor Name or Specialty",
                            placeholder = "e.g. Cardiologist, Dr. Rahman",
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = "Search", tint = PrimaryTeal)
                            }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Specialty filter chips
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val specialties = listOf("All", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics")
                            specialties.forEach { spec ->
                                FilterChip(
                                    selected = uiState.selectedDesignation == spec,
                                    onClick = { viewModel.selectDesignation(spec) },
                                    label = { Text(spec, fontSize = 12.sp) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = PrimaryTeal,
                                        selectedLabelColor = Color.White
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (uiState.doctors.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("No verified doctors match your criteria", color = OnSurfaceVariant)
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(14.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(uiState.doctors, key = { it.doctorId }) { doctor ->
                                    DoctorCard(
                                        doctor = doctor,
                                        onBookClick = {
                                            viewModel.selectDoctor(doctor)
                                            showBookingSheet = true
                                        }
                                    )
                                }
                            }
                        }
                    }
                } else {
                    // My Bookings Tab
                    if (uiState.myAppointments.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "No appointments booked yet",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = OnSurface
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Search for a doctor in the directory to schedule your first consultation.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = OnSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            MediSyncButton(
                                text = "Find a Doctor",
                                onClick = { selectedTab = 0 }
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.myAppointments, key = { it.appointmentId }) { appointment ->
                                AppointmentCard(
                                    appointment = appointment,
                                    userRole = userRole,
                                    onStatusChange = { newStatus ->
                                        viewModel.updateAppointmentStatus(appointment.appointmentId, newStatus)
                                        val toastMsg = when (newStatus) {
                                            AppointmentStatus.CONFIRMED -> "Appointment confirmed!"
                                            AppointmentStatus.COMPLETED -> "Consultation marked completed!"
                                            AppointmentStatus.CANCELLED -> "Appointment cancelled."
                                            else -> "Status updated."
                                        }
                                        Toast.makeText(context, toastMsg, Toast.LENGTH_SHORT).show()
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }


        // Booking Bottom Sheet
        if (showBookingSheet && uiState.selectedDoctor != null) {
            val doctor = uiState.selectedDoctor!!
            ModalBottomSheet(
                onDismissRequest = { showBookingSheet = false },
                containerColor = CanvasBackground
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 12.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        text = "Book Appointment",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "with ${doctor.fullName} (${doctor.specialization})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PrimaryTeal,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    MediSyncTextField(
                        value = bookingDate,
                        onValueChange = { bookingDate = it },
                        label = "Appointment Date (YYYY-MM-DD)",
                        placeholder = "2026-09-10",
                        leadingIcon = {
                            Icon(Icons.Default.CalendarMonth, contentDescription = "Date", tint = PrimaryTeal)
                        }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = bookingTime,
                        onValueChange = { bookingTime = it },
                        label = "Preferred Time",
                        placeholder = "18:30",
                        leadingIcon = {
                            Icon(Icons.Default.Schedule, contentDescription = "Time", tint = PrimaryTeal)
                        }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = bookingReason,
                        onValueChange = { bookingReason = it },
                        label = "Reason for Visit",
                        placeholder = "e.g. Chest pain, Follow-up consultation",
                        leadingIcon = {
                            Icon(Icons.Default.MedicalServices, contentDescription = "Reason", tint = PrimaryTeal)
                        }
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    MediSyncButton(
                        text = "Confirm Booking (৳${doctor.consultationFee.toInt()})",
                        isLoading = uiState.isLoading,
                        onClick = {
                            viewModel.bookAppointment(
                                doctorId = doctor.doctorId,
                                slotId = doctor.slots.firstOrNull()?.slotId,
                                date = bookingDate,
                                startTime = bookingTime,
                                endTime = "19:00",
                                locationName = doctor.slots.firstOrNull()?.locationName ?: "Main Chamber",
                                reason = bookingReason,
                                onSuccess = {
                                    showBookingSheet = false
                                    selectedTab = 1
                                    Toast.makeText(context, "Appointment booked successfully!", Toast.LENGTH_LONG).show()
                                }
                            )
                        }
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun DoctorCard(
    doctor: DoctorDto,
    onBookClick: () -> Unit
) {
    ElevationCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            verticalAlignment = Alignment.Top,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(PrimaryTeal.copy(alpha = 0.12f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = doctor.fullName,
                    tint = PrimaryTeal,
                    modifier = Modifier.size(30.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doctor.fullName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
                Text(
                    text = "${doctor.designation} • ${doctor.qualifications ?: "MBBS"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = "Rating", tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${doctor.rating} (${doctor.totalReviews} reviews) • ${doctor.experienceYears} yrs exp",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = OnSurface
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = "Chamber", tint = SecondarySkyBlue, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${doctor.area ?: "Dhanmondi"}, ${doctor.city ?: "Dhaka"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                Text(text = "Consultation Fee", style = MaterialTheme.typography.labelSmall, color = OnSurfaceVariant)
                Text(
                    text = "৳${doctor.consultationFee.toInt()}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryTeal
                )
            }
            MediSyncButton(
                text = "Book Appointment",
                onClick = onBookClick,
                modifier = Modifier.width(170.dp)
            )
        }
    }
}

@Composable
private fun AppointmentCard(
    appointment: AppointmentDto,
    userRole: com.medisync.android.data.model.UserRole = com.medisync.android.data.model.UserRole.PATIENT,
    onStatusChange: (AppointmentStatus) -> Unit
) {
    val isDoctor = userRole == com.medisync.android.data.model.UserRole.DOCTOR
    val titleText = if (isDoctor) {
        appointment.patientName?.ifBlank { null } ?: "Patient Consultation"
    } else {
        appointment.doctorName ?: "Doctor Consultation"
    }

    ElevationCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = titleText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            StatusBadge(
                text = appointment.status.name,
                type = when (appointment.status) {
                    AppointmentStatus.CONFIRMED -> BadgeType.VERIFIED
                    AppointmentStatus.PENDING -> BadgeType.AI_ASSISTED
                    AppointmentStatus.CANCELLED -> BadgeType.URGENCY_HIGH
                    AppointmentStatus.COMPLETED -> BadgeType.VERIFIED
                }
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "${appointment.designation ?: if (isDoctor) "General Visit" else "Specialist"} • ${appointment.locationName ?: "Main Chamber"}",
            style = MaterialTheme.typography.bodySmall,
            color = OnSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CalendarMonth, contentDescription = "Date", tint = PrimaryTeal, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = appointment.appointmentDate, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Schedule, contentDescription = "Time", tint = PrimaryTeal, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = appointment.startTime, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
            }
        }
        if (!appointment.reason.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Reason: ${appointment.reason}",
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant
            )
        }

        // Actions
        if (isDoctor) {
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
            ) {
                if (appointment.status == AppointmentStatus.PENDING) {
                    Box(
                        modifier = Modifier
                            .background(PrimaryTeal, shape = RoundedCornerShape(8.dp))
                            .clickable { onStatusChange(AppointmentStatus.CONFIRMED) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Confirm", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFEE2E2), shape = RoundedCornerShape(8.dp))
                            .clickable { onStatusChange(AppointmentStatus.CANCELLED) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Decline", color = ErrorCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                } else if (appointment.status == AppointmentStatus.CONFIRMED) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF059669), shape = RoundedCornerShape(8.dp))
                            .clickable { onStatusChange(AppointmentStatus.COMPLETED) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Mark Completed", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFEE2E2), shape = RoundedCornerShape(8.dp))
                            .clickable { onStatusChange(AppointmentStatus.CANCELLED) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Cancel", color = ErrorCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            if (appointment.status == AppointmentStatus.PENDING) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        text = "Cancel Request",
                        color = ErrorCrimson,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { onStatusChange(AppointmentStatus.CANCELLED) }
                    )
                }
            }
        }
    }
}

