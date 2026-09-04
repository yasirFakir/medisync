package com.medisync.android

import android.app.Application
import com.medisync.android.core.alarms.MedicationAlarmScheduler
import com.medisync.android.core.network.MistralAiClient
import com.medisync.android.core.network.NetworkClient
import com.medisync.android.core.notifications.NotificationHelper
import com.medisync.android.core.notifications.NotificationStore
import com.medisync.android.core.storage.AuthTokenManager
import com.medisync.android.data.repository.AlertsRepository
import com.medisync.android.data.repository.AlertsRepositoryImpl
import com.medisync.android.data.repository.AlternativesRepository
import com.medisync.android.data.repository.AlternativesRepositoryImpl
import com.medisync.android.data.repository.AuthRepository
import com.medisync.android.data.repository.AuthRepositoryImpl
import com.medisync.android.data.repository.DispenserRepository
import com.medisync.android.data.repository.DispenserRepositoryImpl
import com.medisync.android.data.repository.EhrRepository
import com.medisync.android.data.repository.EhrRepositoryImpl
import com.medisync.android.data.repository.PharmacyRepository
import com.medisync.android.data.repository.PharmacyRepositoryImpl
import com.medisync.android.data.repository.PrescriptionRepository
import com.medisync.android.data.repository.PrescriptionRepositoryImpl
import com.medisync.android.data.repository.TotpRepository
import com.medisync.android.data.repository.TotpRepositoryImpl
import com.medisync.android.data.repository.TriageRepository
import com.medisync.android.data.repository.TriageRepositoryImpl
import io.ktor.client.HttpClient

class MediSyncApplication : Application() {

    lateinit var tokenManager: AuthTokenManager
        private set

    lateinit var httpClient: HttpClient
        private set

    lateinit var externalHttpClient: HttpClient
        private set

    lateinit var mistralAiClient: MistralAiClient
        private set

    lateinit var notificationStore: NotificationStore
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var triageRepository: TriageRepository
        private set

    lateinit var prescriptionRepository: PrescriptionRepository
        private set

    lateinit var alternativesRepository: AlternativesRepository
        private set

    lateinit var pharmacyRepository: PharmacyRepository
        private set

    lateinit var alertsRepository: AlertsRepository
        private set

    lateinit var totpRepository: TotpRepository
        private set

    lateinit var ehrRepository: EhrRepository
        private set

    lateinit var dispenserRepository: DispenserRepository
        private set

    lateinit var alarmScheduler: MedicationAlarmScheduler
        private set

    override fun onCreate() {
        super.onCreate()
        tokenManager = AuthTokenManager(this)
        httpClient = NetworkClient.create(tokenManager)
        externalHttpClient = NetworkClient.createExternalClient()
        mistralAiClient = MistralAiClient(externalHttpClient, BuildConfig.MISTRAL_API_KEY)
        notificationStore = NotificationStore(this)
        NotificationHelper.createNotificationChannels(this)

        authRepository = AuthRepositoryImpl(httpClient, tokenManager)
        triageRepository = TriageRepositoryImpl(httpClient, mistralAiClient)
        prescriptionRepository = PrescriptionRepositoryImpl(httpClient, mistralAiClient)
        alternativesRepository = AlternativesRepositoryImpl(httpClient)
        pharmacyRepository = PharmacyRepositoryImpl(httpClient)
        alertsRepository = AlertsRepositoryImpl(httpClient)
        totpRepository = TotpRepositoryImpl(httpClient)
        ehrRepository = EhrRepositoryImpl(httpClient)
        dispenserRepository = DispenserRepositoryImpl(httpClient)
        alarmScheduler = MedicationAlarmScheduler(this)
    }
}
