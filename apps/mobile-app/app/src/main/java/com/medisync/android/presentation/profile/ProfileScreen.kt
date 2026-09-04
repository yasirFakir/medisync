package com.medisync.android.presentation.profile

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medisync.android.core.components.BadgeType
import com.medisync.android.core.components.ButtonVariant
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
import com.medisync.android.data.model.UpdateProfileRequest
import com.medisync.android.data.model.UserProfile
import com.medisync.android.data.model.UserRole
import com.medisync.android.presentation.auth.AuthViewModel
import com.medisync.android.presentation.totp.TotpCodeBottomSheet
import com.medisync.android.presentation.totp.TotpViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    user: UserProfile?,
    authViewModel: AuthViewModel,
    totpViewModel: TotpViewModel,
    onLogout: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val authState by authViewModel.uiState.collectAsState()
    val currentUser = authState.user ?: user
    val context = LocalContext.current
    var showTotpSheet by remember { mutableStateOf(false) }

    // Common fields
    var fullName by remember(currentUser) { mutableStateOf(currentUser?.fullName ?: "") }
    var phoneNumber by remember(currentUser) { mutableStateOf(currentUser?.phoneNumber ?: "") }
    var address by remember(currentUser) { mutableStateOf(currentUser?.address ?: "") }
    var dateOfBirth by remember(currentUser) { mutableStateOf(currentUser?.dateOfBirth?.take(10) ?: "") }
    var gender by remember(currentUser) { mutableStateOf(currentUser?.gender ?: "") }
    var bloodGroup by remember(currentUser) { mutableStateOf(currentUser?.bloodGroup ?: "") }
    var emergencyContact by remember(currentUser) { mutableStateOf(currentUser?.emergencyContact ?: "") }

    // Doctor specific fields
    var designation by remember(currentUser) { mutableStateOf(currentUser?.designation ?: "") }
    var specialty by remember(currentUser) { mutableStateOf(currentUser?.specialty ?: "") }
    var degrees by remember(currentUser) { mutableStateOf(currentUser?.degrees ?: "") }
    var area by remember(currentUser) { mutableStateOf(currentUser?.area ?: "") }
    var city by remember(currentUser) { mutableStateOf(currentUser?.city ?: "") }
    var experienceYears by remember(currentUser) { mutableStateOf(currentUser?.experienceYears?.toString() ?: "") }
    var consultationFee by remember(currentUser) { mutableStateOf(currentUser?.consultationFee?.toInt()?.toString() ?: "") }
    var bio by remember(currentUser) { mutableStateOf(currentUser?.bio ?: "") }

    // Pharmacy specific fields
    var storeName by remember(currentUser) { mutableStateOf(currentUser?.storeName ?: "") }
    var streetAddress by remember(currentUser) { mutableStateOf(currentUser?.streetAddress ?: "") }
    var pharmacyCity by remember(currentUser) { mutableStateOf(currentUser?.pharmacyCity ?: "") }

    var successMessage by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    var genderDropdownExpanded by remember { mutableStateOf(false) }
    var bloodGroupDropdownExpanded by remember { mutableStateOf(false) }

    val role = currentUser?.role ?: UserRole.PATIENT

    LaunchedEffect(Unit) {
        authViewModel.loadProfile()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile & Account Settings", fontWeight = FontWeight.Bold) },
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
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Identity Card
            ElevationCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(68.dp)
                            .background(PrimaryTeal.copy(alpha = 0.12f), shape = CircleShape)
                            .border(2.dp, PrimaryTeal.copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = when (role) {
                                UserRole.DOCTOR -> Icons.Default.MedicalServices
                                UserRole.PHARMACY -> Icons.Default.Business
                                else -> Icons.Default.Person
                            },
                            contentDescription = "Avatar",
                            tint = PrimaryTeal,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = fullName.ifBlank { currentUser?.fullName ?: "User" },
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = OnSurface
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = currentUser?.email ?: "user@medisync.ai",
                            style = MaterialTheme.typography.bodySmall,
                            color = OnSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        StatusBadge(
                            text = role.name,
                            type = when (role) {
                                UserRole.PATIENT -> BadgeType.VERIFIED
                                UserRole.DOCTOR -> BadgeType.AI_ASSISTED
                                UserRole.PHARMACY -> BadgeType.EXTRACTED
                                UserRole.ADMIN -> BadgeType.URGENCY_HIGH
                            }
                        )
                    }
                }
            }

            // Success Alert Banner
            successMessage?.let { msg ->
                ElevationCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = Color(0xFFECFDF5)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = "Success", tint = Color(0xFF059669))
                        Text(
                            text = msg,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF065F46),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Error Alert Banner
            errorMessage?.let { err ->
                ElevationCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = Color(0xFFFEF2F2)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Default.Error, contentDescription = "Error", tint = ErrorCrimson)
                        Text(
                            text = err,
                            style = MaterialTheme.typography.bodyMedium,
                            color = ErrorCrimson,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }


            // Dynamic Passcode Generator Banner for Patients
            if (role == UserRole.PATIENT) {
                ElevationCard(
                    onClick = { showTotpSheet = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(PrimaryTeal.copy(alpha = 0.12f), shape = MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = "TOTP", tint = PrimaryTeal)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Dynamic Access Passcode",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "30-sec dynamic passcode for doctor & pharmacy access",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant
                            )
                        }
                        Icon(Icons.Default.Key, contentDescription = "Key", tint = PrimaryTeal)
                    }
                }
            }

            // ─── PHARMACY VIEW ──────────────────────────────────────────────
            if (role == UserRole.PHARMACY) {
                ElevationCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Business, contentDescription = "Pharmacy", tint = PrimaryTeal)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Pharmacy Store & Business Details",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        StatusBadge(
                            text = if (currentUser?.isVerified == true) "Verified Partner" else "Pending Verification",
                            type = if (currentUser?.isVerified == true) BadgeType.VERIFIED else BadgeType.AI_ASSISTED
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    MediSyncTextField(
                        value = storeName,
                        onValueChange = { storeName = it },
                        label = "Pharmacy / Store Name *",
                        placeholder = "e.g. MediCare Pharmacy"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = currentUser?.licenseNumber ?: "LIC-DH-001 (Registered)",
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = { Text("Drug License Number (Registered)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledContainerColor = Color(0xFFF1F5F9),
                            disabledTextColor = Color(0xFF64748B)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = currentUser?.email ?: "",
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = { Text("Official Store Email (Read-Only)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledContainerColor = Color(0xFFF1F5F9),
                            disabledTextColor = Color(0xFF64748B)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = phoneNumber,
                        onValueChange = { phoneNumber = it },
                        label = "Store Helpline / Contact Phone",
                        placeholder = "+880 1700-000000"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = pharmacyCity,
                        onValueChange = { pharmacyCity = it },
                        label = "Store City / Area",
                        placeholder = "e.g. Dhanmondi, Dhaka"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = streetAddress,
                        onValueChange = { streetAddress = it },
                        label = "Store Street Address / Location",
                        placeholder = "e.g. 45 Green Road, Dhanmondi, Dhaka"
                    )
                }
            } else {
                // ─── PERSONAL INFORMATION (Patient, Doctor, Admin) ───────────────
                ElevationCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Person, contentDescription = "Personal", tint = PrimaryTeal)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Personal Information",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    MediSyncTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = "Full Name *",
                        placeholder = "e.g. Dr. John Doe / Sarah Connor"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = currentUser?.email ?: "",
                        onValueChange = {},
                        readOnly = true,
                        enabled = false,
                        label = { Text("Registered Email (Read-Only)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledContainerColor = Color(0xFFF1F5F9),
                            disabledTextColor = Color(0xFF64748B)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = phoneNumber,
                        onValueChange = { phoneNumber = it },
                        label = "Contact Phone Number",
                        placeholder = "+880 1700-000000"
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    MediSyncTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = "Residential Address",
                        placeholder = "Street Address, City, Postal Code"
                    )

                    if (role == UserRole.PATIENT) {
                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = dateOfBirth,
                            onValueChange = { dateOfBirth = it },
                            label = "Date of Birth (YYYY-MM-DD)",
                            placeholder = "1990-05-15"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Gender Dropdown
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = gender.ifBlank { "Select Gender" },
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Gender") },
                                trailingIcon = {
                                    Icon(
                                        Icons.Default.ArrowDropDown,
                                        contentDescription = "Dropdown",
                                        modifier = Modifier.clickable { genderDropdownExpanded = true }
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { genderDropdownExpanded = true },
                                shape = RoundedCornerShape(12.dp)
                            )
                            DropdownMenu(
                                expanded = genderDropdownExpanded,
                                onDismissRequest = { genderDropdownExpanded = false }
                            ) {
                                listOf("Male", "Female", "Other", "Prefer not to say").forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option) },
                                        onClick = {
                                            gender = option
                                            genderDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Blood Group Dropdown
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = bloodGroup.ifBlank { "Select Blood Group" },
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Blood Group") },
                                trailingIcon = {
                                    Icon(
                                        Icons.Default.ArrowDropDown,
                                        contentDescription = "Dropdown",
                                        modifier = Modifier.clickable { bloodGroupDropdownExpanded = true }
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { bloodGroupDropdownExpanded = true },
                                shape = RoundedCornerShape(12.dp)
                            )
                            DropdownMenu(
                                expanded = bloodGroupDropdownExpanded,
                                onDismissRequest = { bloodGroupDropdownExpanded = false }
                            ) {
                                listOf("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-").forEach { bg ->
                                    DropdownMenuItem(
                                        text = { Text(bg) },
                                        onClick = {
                                            bloodGroup = bg
                                            bloodGroupDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = emergencyContact,
                            onValueChange = { emergencyContact = it },
                            label = "Emergency Contact (Name & Phone)",
                            placeholder = "e.g. Spouse (+88017XXXXXXXX)"
                        )
                    }
                }

                // ─── DOCTOR CLINICAL PRACTICE DETAILS ────────────────────────────
                if (role == UserRole.DOCTOR) {
                    ElevationCard(modifier = Modifier.fillMaxWidth()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.School, contentDescription = "Clinical", tint = PrimaryTeal)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Clinical & Practice Details",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        MediSyncTextField(
                            value = designation,
                            onValueChange = { designation = it },
                            label = "Designation / Title",
                            placeholder = "e.g. Associate Professor / Senior Consultant"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = specialty,
                            onValueChange = { specialty = it },
                            label = "Medical Specialty",
                            placeholder = "e.g. Cardiologist, Neurologist, General Medicine"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = degrees,
                            onValueChange = { degrees = it },
                            label = "Academic Degrees & Qualifications",
                            placeholder = "e.g. MBBS, FCPS (Medicine), MD (Cardiology)"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = experienceYears,
                            onValueChange = { experienceYears = it },
                            label = "Years of Clinical Experience",
                            placeholder = "e.g. 12"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = consultationFee,
                            onValueChange = { consultationFee = it },
                            label = "Consultation Fee (BDT)",
                            placeholder = "e.g. 1000"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = area,
                            onValueChange = { area = it },
                            label = "Clinic / Chamber Area",
                            placeholder = "e.g. Dhanmondi / Gulshan"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = city,
                            onValueChange = { city = it },
                            label = "City",
                            placeholder = "e.g. Dhaka"
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        MediSyncTextField(
                            value = bio,
                            onValueChange = { bio = it },
                            label = "Doctor Bio / Clinical Summary",
                            placeholder = "Share a short bio regarding clinical focus and expertise..."
                        )
                    }
                }
            }

            // Save Changes Action Button
            MediSyncButton(
                text = "Save All Profile Changes",
                isLoading = authState.isLoading,
                onClick = {
                    if (fullName.isBlank()) {
                        errorMessage = "Full name is required."
                        return@MediSyncButton
                    }
                    errorMessage = null
                    successMessage = null

                    val req = UpdateProfileRequest(
                        fullName = fullName.trim(),
                        phoneNumber = phoneNumber.trim().ifBlank { null },
                        address = address.trim().ifBlank { null },
                        dateOfBirth = dateOfBirth.trim().ifBlank { null },
                        gender = gender.trim().ifBlank { null },
                        bloodGroup = bloodGroup.trim().ifBlank { null },
                        emergencyContact = emergencyContact.trim().ifBlank { null },
                        designation = if (role == UserRole.DOCTOR) designation.trim().ifBlank { null } else null,
                        specialty = if (role == UserRole.DOCTOR) specialty.trim().ifBlank { null } else null,
                        degrees = if (role == UserRole.DOCTOR) degrees.trim().ifBlank { null } else null,
                        area = if (role == UserRole.DOCTOR) area.trim().ifBlank { null } else null,
                        city = if (role == UserRole.DOCTOR) city.trim().ifBlank { null } else null,
                        experienceYears = if (role == UserRole.DOCTOR) experienceYears.toIntOrNull() else null,
                        consultationFee = if (role == UserRole.DOCTOR) consultationFee.toDoubleOrNull() else null,
                        bio = if (role == UserRole.DOCTOR) bio.trim().ifBlank { null } else null,
                        storeName = if (role == UserRole.PHARMACY) (storeName.ifBlank { fullName }).trim() else null,
                        streetAddress = if (role == UserRole.PHARMACY) streetAddress.trim().ifBlank { null } else null,
                        pharmacyCity = if (role == UserRole.PHARMACY) pharmacyCity.trim().ifBlank { null } else null
                    )

                    authViewModel.updateProfile(
                        request = req,
                        onSuccess = {
                            successMessage = "Profile information updated and saved successfully."
                            Toast.makeText(context, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
                        },
                        onError = { err ->
                            errorMessage = err
                        }
                    )
                }
            )

            // Sign Out Button
            MediSyncButton(
                text = "Sign Out",
                onClick = onLogout,
                variant = ButtonVariant.OUTLINE
            )

            Spacer(modifier = Modifier.height(20.dp))
        }

        if (showTotpSheet) {
            TotpCodeBottomSheet(
                viewModel = totpViewModel,
                onDismiss = { showTotpSheet = false }
            )
        }
    }
}
