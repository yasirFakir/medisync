package com.medisync.android.presentation.navigation

import com.medisync.android.data.model.UserRole

sealed class Screen(val route: String) {
    data object Welcome : Screen("welcome")
    data object Login : Screen("login/{role}") {
        fun createRoute(role: UserRole) = "login/${role.name}"
    }
    data object Register : Screen("register")
    data object Dashboard : Screen("dashboard")
    data object Notifications : Screen("notifications")
    data object Triage : Screen("triage")
    data object UploadPrescription : Screen("prescription/upload")
    data object PrescriptionAnalysis : Screen("prescription/analysis")
    data object PrescriptionWallet : Screen("prescription/wallet")
    data object DrugDetail : Screen("drugs/{drugId}") {
        fun createRoute(drugId: String) = "drugs/$drugId"
    }
    data object Alternatives : Screen("alternatives/{drugId}") {
        fun createRoute(drugId: String) = "alternatives/$drugId"
    }
    data object PharmacyLocator : Screen("pharmacies?drugId={drugId}") {
        fun createRoute(drugId: String? = null) = if (drugId != null) "pharmacies?drugId=$drugId" else "pharmacies"
    }
    data object MedicationReminders : Screen("reminders")
    data object Appointments : Screen("appointments")
    data object Profile : Screen("profile")
    data object DoctorPatientList : Screen("doctor/patients")
    data object DoctorEhrTimeline : Screen("doctor/timeline")
    data object PharmacyDispenser : Screen("pharmacy/dispenser")
    
    data object ClinicalSessions : Screen("doctor/sessions")
    data object PharmacyInventory : Screen("pharmacy/inventory")
    data object PharmacyUpdateStock : Screen("pharmacy/stock")
    data object PharmacySales : Screen("pharmacy/sales")

    data object AdminDashboard : Screen("admin/dashboard")
    data object AdminUsers : Screen("admin/users")
    data object AdminDrugs : Screen("admin/drugs")
    data object AdminTriage : Screen("admin/triage")
    data object AdminPharmacies : Screen("admin/pharmacies")
    data object Availability : Screen("availability")
}
