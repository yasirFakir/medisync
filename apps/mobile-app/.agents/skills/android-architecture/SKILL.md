---
name: android-architecture
description: Translate web product specifications into idiomatic Clean Android Architecture (Data, Domain, Presentation) with Jetpack Compose.
---

# Android Architecture Skill

## Architecture Blueprint
- **Presentation Layer:** Jetpack Compose + ViewModels (`StateFlow` / `MVI` pattern) + Navigation Compose.
- **Domain Layer:** UseCases / Interactors for business rules and calculations.
- **Data Layer:** Repositories + Ktor/Retrofit Remote Data Source + Room Local Data Source + EncryptedSharedPreferences for tokens.
- **Dependency Injection:** Hilt / Koin.
- **Coroutines & Flow:** Asynchronous pipelines with structured concurrency.

## Guidelines
1. Keep ViewModels pure; no Android framework dependencies except SavedStateHandle.
2. Always expose immutable UI state (`StateFlow<UiState>`).
3. Domain models must be independent of DTOs and database entities.
