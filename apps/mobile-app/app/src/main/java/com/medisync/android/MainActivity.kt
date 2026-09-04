package com.medisync.android

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.medisync.android.core.theme.MediSyncTheme
import com.medisync.android.presentation.alerts.AlertsViewModel
import com.medisync.android.presentation.alternatives.AlternativesViewModel
import com.medisync.android.presentation.auth.AuthViewModel
import com.medisync.android.presentation.auth.AuthViewModelFactory
import com.medisync.android.presentation.dispenser.DispenserViewModel
import com.medisync.android.presentation.doctor.DoctorViewModel
import com.medisync.android.presentation.navigation.MediSyncNavGraph
import com.medisync.android.presentation.notifications.NotificationsViewModel
import com.medisync.android.presentation.pharmacy.PharmacyViewModel
import com.medisync.android.presentation.prescription.PrescriptionViewModel
import com.medisync.android.presentation.totp.TotpViewModel
import com.medisync.android.presentation.triage.TriageViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as MediSyncApplication

        setContent {
            MediSyncTheme {
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { _ ->
                    // Notification permission result handled
                }

                LaunchedEffect(Unit) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val hasPermission = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.POST_NOTIFICATIONS
                        ) == PackageManager.PERMISSION_GRANTED

                        if (!hasPermission) {
                            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }
                }

                val navController = rememberNavController()
                val authViewModel: AuthViewModel = viewModel(
                    factory = AuthViewModelFactory(app.authRepository)
                )
                val triageViewModel: TriageViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return TriageViewModel(app.triageRepository) as T
                        }
                    }
                )
                val prescriptionViewModel: PrescriptionViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return PrescriptionViewModel(app.prescriptionRepository) as T
                        }
                    }
                )
                val alternativesViewModel: AlternativesViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return AlternativesViewModel(app.alternativesRepository) as T
                        }
                    }
                )
                val pharmacyViewModel: PharmacyViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return PharmacyViewModel(app.pharmacyRepository) as T
                        }
                    }
                )
                val alertsViewModel: AlertsViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return AlertsViewModel(app.alertsRepository, app.alarmScheduler) as T
                        }
                    }
                )
                val totpViewModel: TotpViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return TotpViewModel(app.totpRepository) as T
                        }
                    }
                )
                val doctorViewModel: DoctorViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return DoctorViewModel(app.ehrRepository) as T
                        }
                    }
                )
                val dispenserViewModel: DispenserViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return DispenserViewModel(app.dispenserRepository) as T
                        }
                    }
                )
                val notificationsViewModel: NotificationsViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        @Suppress("UNCHECKED_CAST")
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return NotificationsViewModel(app.notificationStore) as T
                        }
                    }
                )

                MediSyncNavGraph(
                    navController = navController,
                    authViewModel = authViewModel,
                    triageViewModel = triageViewModel,
                    prescriptionViewModel = prescriptionViewModel,
                    alternativesViewModel = alternativesViewModel,
                    pharmacyViewModel = pharmacyViewModel,
                    alertsViewModel = alertsViewModel,
                    totpViewModel = totpViewModel,
                    doctorViewModel = doctorViewModel,
                    dispenserViewModel = dispenserViewModel,
                    notificationsViewModel = notificationsViewModel
                )
            }
        }
    }
}
