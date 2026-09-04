package com.medisync.android.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.medisync.android.data.model.UserRole
import com.medisync.android.presentation.alerts.AlertsViewModel
import com.medisync.android.presentation.alerts.MedicationRemindersScreen
import com.medisync.android.presentation.alternatives.AlternativesScreen
import com.medisync.android.presentation.alternatives.AlternativesViewModel
import com.medisync.android.presentation.auth.AuthViewModel
import com.medisync.android.presentation.auth.LoginScreen
import com.medisync.android.presentation.auth.RegisterScreen
import com.medisync.android.presentation.auth.WelcomeScreen
import com.medisync.android.presentation.dashboard.DashboardScreen
import com.medisync.android.presentation.dispenser.DispenserViewModel
import com.medisync.android.presentation.dispenser.PharmacyDispenserScreen
import com.medisync.android.presentation.doctor.DoctorEhrTimelineScreen
import com.medisync.android.presentation.doctor.DoctorPatientListScreen
import com.medisync.android.presentation.doctor.DoctorViewModel
import com.medisync.android.presentation.drug.DrugDetailScreen
import com.medisync.android.presentation.notifications.NotificationsScreen
import com.medisync.android.presentation.notifications.NotificationsViewModel
import com.medisync.android.presentation.pharmacy.PharmacyLocatorScreen
import com.medisync.android.presentation.pharmacy.PharmacyViewModel
import com.medisync.android.presentation.prescription.PrescriptionAnalysisScreen
import com.medisync.android.presentation.prescription.PrescriptionViewModel
import com.medisync.android.presentation.prescription.PrescriptionWalletScreen
import com.medisync.android.presentation.prescription.UploadPrescriptionScreen
import com.medisync.android.presentation.totp.TotpViewModel
import com.medisync.android.presentation.triage.TriageChatScreen
import com.medisync.android.presentation.triage.TriageViewModel

@Composable
fun MediSyncNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    triageViewModel: TriageViewModel,
    prescriptionViewModel: PrescriptionViewModel,
    alternativesViewModel: AlternativesViewModel,
    pharmacyViewModel: PharmacyViewModel,
    alertsViewModel: AlertsViewModel,
    totpViewModel: TotpViewModel,
    doctorViewModel: DoctorViewModel,
    dispenserViewModel: DispenserViewModel,
    notificationsViewModel: NotificationsViewModel
) {
    val authState by authViewModel.uiState.collectAsState()
    val unreadCount by notificationsViewModel.unreadCount.collectAsState()

    NavHost(
        navController = navController,
        startDestination = if (authState.isSuccess) Screen.Dashboard.route else Screen.Welcome.route
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onNavigateToLogin = { role ->
                    navController.navigate(Screen.Login.createRoute(role))
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }

        composable(
            route = Screen.Login.route,
            arguments = listOf(navArgument("role") { type = NavType.StringType })
        ) { backStackEntry ->
            val roleParam = backStackEntry.arguments?.getString("role") ?: UserRole.PATIENT.name
            val role = try { UserRole.valueOf(roleParam) } catch (e: Exception) { UserRole.PATIENT }

            LoginScreen(
                viewModel = authViewModel,
                initialRole = role,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                viewModel = authViewModel,
                onRegisterSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                user = authState.user,
                totpViewModel = totpViewModel,
                unreadNotificationCount = unreadCount,
                onNavigateToNotifications = {
                    navController.navigate(Screen.Notifications.route)
                },
                onNavigateToTriage = {
                    navController.navigate(Screen.Triage.route)
                },
                onNavigateToScan = {
                    navController.navigate(Screen.UploadPrescription.route)
                },
                onNavigateToWallet = {
                    navController.navigate(Screen.PrescriptionWallet.route)
                },
                onNavigateToReminders = {
                    navController.navigate(Screen.MedicationReminders.route)
                },
                onNavigateToDoctorPortal = {
                    navController.navigate(Screen.DoctorPatientList.route)
                },
                onNavigateToPharmacyPortal = {
                    navController.navigate(Screen.PharmacyDispenser.route)
                },
                onNavigateToDrugDetail = { drugId ->
                    navController.navigate(Screen.DrugDetail.createRoute(drugId))
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Notifications.route) {
            NotificationsScreen(
                viewModel = notificationsViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Triage.route) {
            TriageChatScreen(
                viewModel = triageViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.UploadPrescription.route) {
            UploadPrescriptionScreen(
                viewModel = prescriptionViewModel,
                onNavigateToAnalysis = {
                    navController.navigate(Screen.PrescriptionAnalysis.route)
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.PrescriptionAnalysis.route) {
            PrescriptionAnalysisScreen(
                viewModel = prescriptionViewModel,
                onSaveSuccess = {
                    navController.navigate(Screen.PrescriptionWallet.route) {
                        popUpTo(Screen.UploadPrescription.route) { inclusive = true }
                    }
                },
                onNavigateToAlternatives = { drugName ->
                    navController.navigate(Screen.Alternatives.createRoute(drugName))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.PrescriptionWallet.route) {
            PrescriptionWalletScreen(
                viewModel = prescriptionViewModel,
                onNavigateToScan = {
                    navController.navigate(Screen.UploadPrescription.route)
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.DrugDetail.route,
            arguments = listOf(navArgument("drugId") { type = NavType.StringType })
        ) { backStackEntry ->
            val drugId = backStackEntry.arguments?.getString("drugId") ?: "metformin-500mg"
            DrugDetailScreen(
                drugId = drugId,
                onNavigateToAlternatives = { selectedDrug ->
                    navController.navigate(Screen.Alternatives.createRoute(selectedDrug))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.Alternatives.route,
            arguments = listOf(navArgument("drugId") { type = NavType.StringType })
        ) { backStackEntry ->
            val drugId = backStackEntry.arguments?.getString("drugId") ?: "napa-extra"
            AlternativesScreen(
                drugId = drugId,
                viewModel = alternativesViewModel,
                onNavigateToAvailability = { selectedDrugId ->
                    navController.navigate(Screen.PharmacyLocator.createRoute(selectedDrugId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.PharmacyLocator.route,
            arguments = listOf(navArgument("drugId") {
                type = NavType.StringType
                nullable = true
                defaultValue = null
            })
        ) { backStackEntry ->
            val drugId = backStackEntry.arguments?.getString("drugId")
            PharmacyLocatorScreen(
                drugId = drugId,
                viewModel = pharmacyViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.MedicationReminders.route) {
            MedicationRemindersScreen(
                viewModel = alertsViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.DoctorPatientList.route) {
            DoctorPatientListScreen(
                viewModel = doctorViewModel,
                onNavigateToTimeline = {
                    navController.navigate(Screen.DoctorEhrTimeline.route)
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.DoctorEhrTimeline.route) {
            DoctorEhrTimelineScreen(
                viewModel = doctorViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.PharmacyDispenser.route) {
            PharmacyDispenserScreen(
                viewModel = dispenserViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
