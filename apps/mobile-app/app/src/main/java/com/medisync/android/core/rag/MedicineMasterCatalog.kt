package com.medisync.android.core.rag

data class MasterDrugItem(
    val drugId: String,
    val brandName: String,
    val saltComposition: String,
    val strength: String,
    val dosageForm: String,
    val manufacturer: String,
    val uses: String,
    val sideEffects: String,
    val estimatedPrice: Double,
    val isGeneric: Boolean,
    val trustRating: Double = 4.8
)

object MedicineMasterCatalog {

    val drugs: List<MasterDrugItem> = listOf(
        // Analgesics / Antipyretics
        MasterDrugItem("d-001", "Napa", "Paracetamol", "500mg", "Tablet", "Beximco Pharma", "Fever, mild to moderate pain, headache", "Nausea, rash", 2.50, false, 4.8),
        MasterDrugItem("d-002", "Paracetamol", "Paracetamol", "500mg", "Tablet", "Generic", "Fever, pain relief", "Liver toxicity at high doses", 1.20, true, 4.5),
        MasterDrugItem("d-003", "Napa Extra", "Paracetamol + Caffeine", "500mg/65mg", "Tablet", "Beximco Pharma", "Headache, migraine, tension pain", "Insomnia, nausea", 4.00, false, 4.7),
        MasterDrugItem("d-004", "Ace", "Paracetamol", "500mg", "Tablet", "Square Pharmaceuticals", "Fever, pain relief", "Nausea, rash", 2.50, false, 4.9),
        MasterDrugItem("d-005", "Ace Plus", "Paracetamol + Caffeine", "500mg/65mg", "Tablet", "Square Pharmaceuticals", "Migraine, headache, body pain", "Mild insomnia", 2.75, true, 4.9),
        MasterDrugItem("d-006", "Fast Plus", "Paracetamol + Caffeine", "500mg/65mg", "Tablet", "Beximco Pharma", "Severe headache, body pain", "Restlessness", 2.75, true, 4.8),
        MasterDrugItem("d-007", "Ibuprofen", "Ibuprofen", "400mg", "Tablet", "Generic", "Pain, inflammation, fever", "GI upset, ulcers", 3.00, true, 4.3),
        MasterDrugItem("d-008", "Brufen", "Ibuprofen", "400mg", "Tablet", "Abbott", "Arthritis, musculoskeletal pain, fever", "Stomach pain", 5.00, false, 4.6),
        MasterDrugItem("d-009", "Diclofenac", "Diclofenac Sodium", "50mg", "Tablet", "Generic", "Pain, arthritis, dysmenorrhea", "GI bleeding", 4.00, true, 4.2),
        MasterDrugItem("d-010", "Voltaren", "Diclofenac Sodium", "50mg", "Tablet", "Novartis", "Osteoarthritis, rheumatoid arthritis, pain", "Edema", 12.00, false, 4.7),

        // Antibiotics
        MasterDrugItem("d-011", "Moxacil", "Amoxicillin Trihydrate", "500mg", "Capsule", "Square Pharmaceuticals", "Bacterial infections, respiratory, UTI", "Diarrhea, nausea", 8.00, false, 4.9),
        MasterDrugItem("d-012", "Amoxicillin", "Amoxicillin Trihydrate", "500mg", "Capsule", "Generic", "Ear, throat, lung, urinary infections", "Diarrhea, rash", 5.00, true, 4.5),
        MasterDrugItem("d-013", "Azithromycin", "Azithromycin", "500mg", "Tablet", "Generic", "Respiratory infections, pharyngitis", "Nausea, diarrhea", 20.00, true, 4.6),
        MasterDrugItem("d-014", "Zithromax", "Azithromycin", "500mg", "Tablet", "Pfizer", "Bacterial respiratory infections, pneumonia", "Nausea, vomiting", 45.00, false, 4.8),
        MasterDrugItem("d-015", "Zithrox", "Azithromycin", "500mg", "Tablet", "Square Pharmaceuticals", "Bronchitis, sinusitis, pharyngitis", "GI distress", 35.00, false, 4.8),
        MasterDrugItem("d-016", "Ciprofloxacin", "Ciprofloxacin HCl", "500mg", "Tablet", "Generic", "Urinary tract, abdominal, bone infections", "Tendon pain, nausea", 10.00, true, 4.4),
        MasterDrugItem("d-017", "Ciprocin", "Ciprofloxacin HCl", "500mg", "Tablet", "Square Pharmaceuticals", "Typhoid, UTI, skin infection", "Dizziness, nausea", 16.00, false, 4.8),
        MasterDrugItem("d-018", "Metronidazole", "Metronidazole", "400mg", "Tablet", "Generic", "Amoebiasis, bacterial vaginosis", "Metallic taste, nausea", 2.00, true, 4.3),
        MasterDrugItem("d-019", "Flagyl", "Metronidazole", "400mg", "Tablet", "Sanofi", "Protozoal & anaerobic infections", "Metallic taste, headache", 4.00, false, 4.7),
        MasterDrugItem("d-020", "Doxycycline", "Doxycycline Hyclate", "100mg", "Capsule", "Generic", "Acne, respiratory infections, malaria", "Photosensitivity, nausea", 3.50, true, 4.3),

        // Gastrointestinal / Antacids
        MasterDrugItem("d-021", "Omeprazole", "Omeprazole", "20mg", "Capsule", "Generic", "GERD, acid reflux, peptic ulcers", "Headache, abdominal pain", 4.00, true, 4.5),
        MasterDrugItem("d-022", "Losectil", "Omeprazole", "20mg", "Capsule", "Eskayef (SK-F)", "Acid reflux, heartburn, gastric ulcer", "Nausea, flatulence", 6.00, false, 4.8),
        MasterDrugItem("d-023", "Seclo", "Omeprazole", "20mg", "Capsule", "Square Pharmaceuticals", "Hyperacidity, peptic ulcer, GERD", "Headache, diarrhea", 6.00, false, 4.9),
        MasterDrugItem("d-024", "Pantoprazole", "Pantoprazole Sodium", "20mg", "Tablet", "Generic", "GERD, erosive esophagitis, Zollinger-Ellison", "Diarrhea, headache", 5.00, true, 4.5),
        MasterDrugItem("d-025", "Pantodac", "Pantoprazole Sodium", "20mg", "Tablet", "Zydus", "Acid-related disorders, reflux esophagitis", "Dizziness, headache", 8.00, false, 4.7),
        MasterDrugItem("d-026", "Sergel", "Esomeprazole Magnesium", "20mg", "Capsule", "Healthcare Pharma", "Erosive GERD, ulcer prophylaxis", "Abdominal discomfort", 8.00, false, 4.9),
        MasterDrugItem("d-027", "Esomeprazole", "Esomeprazole Magnesium", "20mg", "Capsule", "Generic", "Heartburn, acid indigestion", "Headache, nausea", 5.00, true, 4.6),
        MasterDrugItem("d-028", "Domperidone", "Domperidone", "10mg", "Tablet", "Generic", "Nausea, vomiting, dyspepsia", "Dry mouth, headache", 2.50, true, 4.4),
        MasterDrugItem("d-029", "Motigut", "Domperidone", "10mg", "Tablet", "Square Pharmaceuticals", "Fullness after meals, nausea, bloating", "Dry mouth", 4.00, false, 4.8),
        MasterDrugItem("d-030", "Antacid", "Aluminium Hydroxide + Magnesium Hydroxide", "500mg", "Tablet", "Generic", "Heartburn, indigestion, upset stomach", "Constipation/diarrhea", 2.00, true, 4.4),

        // Antihistamines & Respiratory
        MasterDrugItem("d-031", "Fexofenadine", "Fexofenadine HCl", "120mg", "Tablet", "Generic", "Allergic rhinitis, urticaria, allergy", "Headache, drowsiness", 6.00, true, 4.6),
        MasterDrugItem("d-032", "Fexo", "Fexofenadine HCl", "120mg", "Tablet", "Square Pharmaceuticals", "Sneezing, runny nose, itchy skin allergy", "Headache", 9.00, false, 4.9),
        MasterDrugItem("d-033", "Cetirizine", "Cetirizine HCl", "10mg", "Tablet", "Generic", "Allergic symptoms, runny nose, hives", "Drowsiness, dry mouth", 2.50, true, 4.5),
        MasterDrugItem("d-034", "Zyrtec", "Cetirizine HCl", "10mg", "Tablet", "GSK", "Allergies, chronic urticaria", "Mild sedation", 8.00, false, 4.7),
        MasterDrugItem("d-035", "Alatrol", "Cetirizine HCl", "10mg", "Tablet", "Square Pharmaceuticals", "Seasonal allergic rhinitis", "Drowsiness", 4.00, false, 4.8),
        MasterDrugItem("d-036", "Montelukast", "Montelukast Sodium", "10mg", "Tablet", "Generic", "Asthma prophylaxis, allergic rhinitis", "Headache, abdominal pain", 8.00, true, 4.5),
        MasterDrugItem("d-037", "Monas", "Montelukast Sodium", "10mg", "Tablet", "Acme Laboratories", "Bronchial asthma, seasonal allergy", "Headache, fatigue", 16.00, false, 4.9),
        MasterDrugItem("d-038", "Montene", "Montelukast Sodium", "10mg", "Tablet", "Square Pharmaceuticals", "Asthma management, chronic allergic rhinitis", "Headache", 16.00, false, 4.9),

        // Cardiovascular & Diabetic
        MasterDrugItem("d-039", "Amlodipine", "Amlodipine Besilate", "5mg", "Tablet", "Generic", "Hypertension, chronic angina", "Peripheral edema, dizziness", 3.00, true, 4.5),
        MasterDrugItem("d-040", "Norvasc", "Amlodipine Besilate", "5mg", "Tablet", "Pfizer", "High blood pressure, chest angina", "Swelling of ankles", 15.00, false, 4.8),
        MasterDrugItem("d-041", "Losartan", "Losartan Potassium", "50mg", "Tablet", "Generic", "Hypertension, kidney protection in diabetes", "Dizziness, fatigue", 5.00, true, 4.6),
        MasterDrugItem("d-042", "Osartil", "Losartan Potassium", "50mg", "Tablet", "Incepta Pharmaceuticals", "Hypertension, diabetic nephropathy", "Dizziness", 8.00, false, 4.8),
        MasterDrugItem("d-043", "Metformin", "Metformin HCl", "500mg", "Tablet", "Generic", "Type 2 diabetes mellitus", "GI disturbance, lactic acidosis", 3.00, true, 4.6),
        MasterDrugItem("d-044", "Glucophage", "Metformin HCl", "500mg", "Tablet", "Merck", "Glycemic control in Type 2 diabetes", "Nausea, diarrhea", 8.00, false, 4.8),
        MasterDrugItem("d-045", "Comet", "Metformin HCl", "500mg", "Tablet", "Square Pharmaceuticals", "Blood glucose regulation", "GI upset", 5.00, false, 4.9),
        MasterDrugItem("d-046", "Atorvastatin", "Atorvastatin Calcium", "10mg", "Tablet", "Generic", "High cholesterol, cardiovascular risk", "Myalgia, liver enzymes", 8.00, true, 4.5),
        MasterDrugItem("d-047", "Lipitor", "Atorvastatin Calcium", "10mg", "Tablet", "Pfizer", "Hypercholesterolemia, heart attack prevention", "Muscle pain", 30.00, false, 4.8),
        MasterDrugItem("d-048", "Aztor", "Atorvastatin Calcium", "10mg", "Tablet", "Square Pharmaceuticals", "Lipid lowering, plaque reduction", "Muscle soreness", 12.00, false, 4.9),
        MasterDrugItem("d-049", "Bicozin", "Vitamin B-Complex + Zinc", "Standard", "Syrup/Tablet", "Square Pharmaceuticals", "Nutritional deficiency, convalescence", "Mild nausea", 3.50, false, 4.8)
    )
}
