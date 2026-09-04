package com.medisync.android.presentation.navigation

import com.medisync.android.data.model.UserRole
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigationFlowTest {

    @Test
    fun `verify all sealed screen routes match expected hierarchy`() {
        assertEquals("welcome", Screen.Welcome.route)
        assertEquals("login/PATIENT", Screen.Login.createRoute(UserRole.PATIENT))
        assertEquals("login/DOCTOR", Screen.Login.createRoute(UserRole.DOCTOR))
        assertEquals("login/PHARMACY", Screen.Login.createRoute(UserRole.PHARMACY))
        assertEquals("register", Screen.Register.route)
        assertEquals("dashboard", Screen.Dashboard.route)
        assertEquals("notifications", Screen.Notifications.route)
        assertEquals("triage", Screen.Triage.route)
        assertEquals("prescription/upload", Screen.UploadPrescription.route)
        assertEquals("prescription/analysis", Screen.PrescriptionAnalysis.route)
        assertEquals("prescription/wallet", Screen.PrescriptionWallet.route)
        assertEquals("drugs/metformin", Screen.DrugDetail.createRoute("metformin"))
        assertEquals("alternatives/napa-extra", Screen.Alternatives.createRoute("napa-extra"))
        assertEquals("pharmacies?drugId=napa-extra", Screen.PharmacyLocator.createRoute("napa-extra"))
        assertEquals("pharmacies", Screen.PharmacyLocator.createRoute(null))
        assertEquals("reminders", Screen.MedicationReminders.route)
        assertEquals("doctor/patients", Screen.DoctorPatientList.route)
        assertEquals("doctor/timeline", Screen.DoctorEhrTimeline.route)
        assertEquals("pharmacy/dispenser", Screen.PharmacyDispenser.route)
    }
}
