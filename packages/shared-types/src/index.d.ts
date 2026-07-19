export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type AlertStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    phoneNumber?: string;
    createdAt: string;
}
export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    phoneNumber?: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
}
export interface Prescription {
    id: string;
    patientId: string;
    doctorName: string;
    rawImageUrl: string;
    digitizedNotes: string;
    medicines: PrescriptionMedicine[];
    suggestedGenericAlternatives: GenericAlternative[];
    createdAt: string;
}
export interface PrescriptionMedicine {
    brandName: string;
    saltComposition: string;
    dosage: string;
    frequency: string;
    duration: string;
}
export interface GenericAlternative {
    drugId: string;
    brandName: string;
    saltComposition: string;
    strength: string;
    price: number;
    isGeneric: boolean;
    trustRating: number;
    score: number;
}
export interface Pharmacy {
    pharmacyId: string;
    storeName: string;
    licenseNumber: string;
    streetAddress: string;
    city: string;
    isVerified: boolean;
    contactEmail?: string;
    contactPhone?: string;
}
export interface DrugMaster {
    drugId: string;
    brandName: string;
    saltComposition: string;
    strength: string;
    estimatedPrice: number;
    isGeneric: boolean;
    trustRating: number;
}
export interface InventoryItem {
    inventoryId: string;
    pharmacyId: string;
    drugId: string;
    inStock: boolean;
    currentPrice: number;
    lastUpdated: string;
    drug?: DrugMaster;
    pharmacy?: Pharmacy;
}
export interface InventoryUpdateRequest {
    drugId: string;
    inStock: boolean;
    price: number;
}
export interface MedicineLocatorResult {
    pharmacy: Pharmacy;
    drug: DrugMaster;
    inStock: boolean;
    currentPrice: number;
    lastUpdated: string;
}
export interface StockCheckMessage {
    id: string;
    senderId: string;
    receiverId: string;
    medicineQuery: string;
    isAvailable: boolean;
    timestamp: string;
}
export interface SymptomTriageRequest {
    patientId: string;
    symptoms: string[];
    additionalNotes?: string;
    conversationHistory?: ChatMessage[];
}
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export interface TriageResponse {
    sessionId: string;
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    response: string;
    recommendedAction: string;
    timestamp: string;
}
export interface EHRRecord {
    recordId: string;
    patientId: string;
    doctorId: string;
    sessionDate: string;
    diagnosis: string;
    observations: string;
    followUpDate?: string;
    prescriptionId?: string;
}
export interface OTPAccessRequest {
    doctorId: string;
    patientId: string;
    otpToken: string;
}
export interface MedicationAlert {
    alertId: string;
    patientId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    scheduledTime: string;
    status: AlertStatus;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
