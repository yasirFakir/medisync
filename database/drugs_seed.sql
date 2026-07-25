-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Drug Catalog Seed (TASK-003)
-- 80 common medicines with full metadata
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO master_pharmacy (
  drug_id, brand_name, salt_composition, strength, dosage_form,
  manufacturer, uses, side_effects, contraindications,
  drug_interactions, storage_instructions, prescription_required,
  estimated_price, is_generic, trust_rating
) VALUES

-- ─── Analgesics / Antipyretics ─────────────────────────────────────────────
('10000000-0000-0000-0000-000000000001', 'Napa', 'Paracetamol', '500mg', 'Tablet',
 'Beximco Pharma', 'Fever, mild to moderate pain, headache', 'Nausea, rash, liver damage on overdose',
 'Severe liver disease, hypersensitivity', 'Warfarin, alcohol', 'Store below 25°C, keep dry', false, 2.50, false, 4.80),

('10000000-0000-0000-0000-000000000002', 'Paracetamol', 'Paracetamol', '500mg', 'Tablet',
 'Generic', 'Fever, pain relief', 'Liver toxicity at high doses', 'Liver/kidney disease',
 'Warfarin, alcohol', 'Store below 25°C', false, 1.20, true, 4.50),

('10000000-0000-0000-0000-000000000003', 'Napa Extra', 'Paracetamol + Caffeine', '500mg/65mg', 'Tablet',
 'Beximco Pharma', 'Headache, migraine, tension pain', 'Insomnia, nausea', 'Liver disease, caffeine sensitivity',
 'MAOIs, alcohol', 'Store below 30°C', false, 4.00, false, 4.70),

('10000000-0000-0000-0000-000000000004', 'ACI Paracetamol', 'Paracetamol', '500mg', 'Tablet',
 'ACI Limited', 'Fever, pain', 'Rash, liver damage on overdose', 'Severe liver disease',
 'Alcohol, warfarin', 'Store below 25°C', false, 1.50, true, 4.40),

('10000000-0000-0000-0000-000000000005', 'Ibuprofen', 'Ibuprofen', '400mg', 'Tablet',
 'Generic', 'Pain, inflammation, fever', 'GI upset, ulcers, kidney issues', 'Peptic ulcer, renal failure',
 'Aspirin, warfarin, lithium', 'Store at room temperature', false, 3.00, true, 4.30),

('10000000-0000-0000-0000-000000000006', 'Brufen', 'Ibuprofen', '400mg', 'Tablet',
 'Abbott', 'Arthritis, musculoskeletal pain, fever', 'Stomach pain, heartburn', 'Active GI bleeding',
 'Aspirin, ACE inhibitors', 'Store below 30°C', false, 5.00, false, 4.60),

('10000000-0000-0000-0000-000000000007', 'Diclofenac', 'Diclofenac Sodium', '50mg', 'Tablet',
 'Generic', 'Pain, arthritis, dysmenorrhea', 'GI bleeding, renal impairment', 'Heart failure, peptic ulcer',
 'Lithium, diuretics', 'Store below 25°C', true, 4.00, true, 4.20),

('10000000-0000-0000-0000-000000000008', 'Voltaren', 'Diclofenac Sodium', '50mg', 'Tablet',
 'Novartis', 'Osteoarthritis, rheumatoid arthritis, pain', 'Edema, hypertension', 'Sulfonamide allergy',
 'Aspirin, warfarin', 'Store below 30°C', true, 12.00, false, 4.70),

-- ─── Antibiotics ──────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000009', 'Moxacil', 'Amoxicillin Trihydrate', '500mg', 'Capsule',
 'Square Pharma', 'Bacterial infections, respiratory, UTI', 'Diarrhea, rash, nausea', 'Penicillin allergy',
 'Warfarin, oral contraceptives', 'Store below 25°C', true, 8.00, false, 4.90),

('10000000-0000-0000-0000-000000000010', 'Amoxicillin', 'Amoxicillin Trihydrate', '500mg', 'Capsule',
 'Generic', 'Ear, throat, lung, urinary infections', 'Diarrhea, rash', 'Penicillin allergy, infectious mononucleosis',
 'Methotrexate, warfarin', 'Store below 25°C', true, 5.00, true, 4.50),

('10000000-0000-0000-0000-000000000011', 'Azithromycin', 'Azithromycin', '500mg', 'Tablet',
 'Generic', 'Community-acquired pneumonia, STIs, pharyngitis', 'Nausea, diarrhea, QT prolongation', 'QT prolongation history',
 'Antacids, digoxin', 'Store below 30°C', true, 20.00, true, 4.60),

('10000000-0000-0000-0000-000000000012', 'Zithromax', 'Azithromycin', '500mg', 'Tablet',
 'Pfizer', 'Upper & lower respiratory infections, skin infections', 'Abdominal pain, headache', 'Jaundice from azithromycin use',
 'Digoxin, cyclosporine', 'Store below 30°C', true, 45.00, false, 4.80),

('10000000-0000-0000-0000-000000000013', 'Ciprofloxacin', 'Ciprofloxacin HCl', '500mg', 'Tablet',
 'Generic', 'UTI, respiratory, GI infections', 'Tendon rupture, nausea, photosensitivity', 'Children under 18, pregnancy',
 'Antacids, theophylline, warfarin', 'Store below 25°C, protect from light', true, 12.00, true, 4.40),

('10000000-0000-0000-0000-000000000014', 'Ciprocin', 'Ciprofloxacin HCl', '500mg', 'Tablet',
 'Square Pharma', 'Complicated UTIs, bone & joint infections', 'Dizziness, GI upset', 'Hypersensitivity to fluoroquinolones',
 'NSAIDs, antacids', 'Store below 30°C', true, 18.00, false, 4.70),

('10000000-0000-0000-0000-000000000015', 'Metronidazole', 'Metronidazole', '400mg', 'Tablet',
 'Generic', 'Anaerobic infections, amoebic dysentery, H. pylori', 'Metallic taste, nausea, dark urine', 'First trimester pregnancy',
 'Alcohol, warfarin, lithium', 'Store below 25°C', true, 3.50, true, 4.50),

('10000000-0000-0000-0000-000000000016', 'Flagyl', 'Metronidazole', '400mg', 'Tablet',
 'Sanofi', 'Bacterial vaginosis, trichomoniasis, amebiasis', 'Headache, dizziness, GI upset', 'Hypersensitivity, first trimester',
 'Alcohol (disulfiram reaction), warfarin', 'Store below 30°C', true, 8.00, false, 4.80),

('10000000-0000-0000-0000-000000000017', 'Doxycycline', 'Doxycycline Hyclate', '100mg', 'Capsule',
 'Generic', 'Acne, malaria prophylaxis, Lyme disease, chlamydia', 'Photosensitivity, esophageal irritation', 'Children under 8, pregnancy',
 'Antacids, iron, dairy products', 'Store below 30°C, protect from light', true, 8.00, true, 4.30),

('10000000-0000-0000-0000-000000000018', 'Cloxacillin', 'Cloxacillin Sodium', '500mg', 'Capsule',
 'Generic', 'Staphylococcal infections, skin/soft tissue infections', 'GI upset, rash', 'Penicillin allergy',
 'Warfarin, oral contraceptives', 'Store below 25°C', true, 10.00, true, 4.20),

-- ─── Antihypertensives ────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000019', 'Amlodipine', 'Amlodipine Besilate', '5mg', 'Tablet',
 'Generic', 'Hypertension, angina pectoris', 'Ankle edema, flushing, headache', 'Hypotension, unstable angina',
 'Cyclosporine, simvastatin', 'Store below 30°C', true, 4.00, true, 4.50),

('10000000-0000-0000-0000-000000000020', 'Norvasc', 'Amlodipine Besilate', '5mg', 'Tablet',
 'Pfizer', 'Hypertension, chronic stable angina', 'Peripheral edema, palpitations', 'Amlodipine hypersensitivity',
 'Simvastatin, CYP3A4 inhibitors', 'Store below 30°C', true, 18.00, false, 4.80),

('10000000-0000-0000-0000-000000000021', 'Losartan', 'Losartan Potassium', '50mg', 'Tablet',
 'Generic', 'Hypertension, diabetic nephropathy, heart failure', 'Dizziness, hyperkalemia', 'Pregnancy, bilateral renal artery stenosis',
 'Potassium supplements, NSAIDs', 'Store below 25°C', true, 6.00, true, 4.40),

('10000000-0000-0000-0000-000000000022', 'Atenolol', 'Atenolol', '50mg', 'Tablet',
 'Generic', 'Hypertension, angina, arrhythmia', 'Bradycardia, fatigue, cold extremities', 'Asthma, COPD, heart block',
 'Verapamil, diltiazem, NSAIDs', 'Store below 25°C', true, 3.00, true, 4.30),

('10000000-0000-0000-0000-000000000023', 'Metoprolol', 'Metoprolol Succinate', '50mg', 'Tablet',
 'Generic', 'Hypertension, angina, heart failure', 'Fatigue, dizziness, bradycardia', 'Severe bradycardia, cardiogenic shock',
 'Verapamil, clonidine', 'Store below 25°C', true, 8.00, true, 4.50),

('10000000-0000-0000-0000-000000000024', 'Enalapril', 'Enalapril Maleate', '5mg', 'Tablet',
 'Generic', 'Hypertension, heart failure, diabetic nephropathy', 'Dry cough, angioedema, hyperkalemia', 'Pregnancy, angioedema history',
 'Potassium-sparing diuretics, NSAIDs', 'Store below 30°C', true, 4.00, true, 4.40),

-- ─── Antidiabetics ────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000025', 'Metformin', 'Metformin HCl', '500mg', 'Tablet',
 'Generic', 'Type 2 diabetes mellitus', 'Nausea, diarrhea, lactic acidosis (rare)', 'Renal impairment, iodinated contrast use',
 'Alcohol, contrast dye, cimetidine', 'Store below 25°C', true, 2.00, true, 4.60),

('10000000-0000-0000-0000-000000000026', 'Glucophage', 'Metformin HCl', '500mg', 'Tablet',
 'Merck', 'Type 2 diabetes, PCOS', 'GI upset, metallic taste', 'eGFR < 30, hepatic impairment',
 'Alcohol, iodinated contrast', 'Store below 30°C', true, 8.00, false, 4.80),

('10000000-0000-0000-0000-000000000027', 'Glibenclamide', 'Glibenclamide', '5mg', 'Tablet',
 'Generic', 'Type 2 diabetes when diet alone insufficient', 'Hypoglycemia, weight gain, rash', 'Type 1 diabetes, severe hepatic/renal disease',
 'Fluconazole, aspirin, alcohol', 'Store below 25°C', true, 3.00, true, 4.20),

('10000000-0000-0000-0000-000000000028', 'Glimepiride', 'Glimepiride', '2mg', 'Tablet',
 'Generic', 'Type 2 diabetes mellitus', 'Hypoglycemia, GI upset, headache', 'Type 1 diabetes, pregnancy',
 'NSAIDs, salicylates, sulfonamides', 'Store below 30°C', true, 6.00, true, 4.40),

-- ─── Antihistamines ───────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000029', 'Cetirizine', 'Cetirizine HCl', '10mg', 'Tablet',
 'Generic', 'Allergic rhinitis, urticaria, hay fever', 'Drowsiness, dry mouth, headache', 'Hypersensitivity to cetirizine',
 'Alcohol, CNS depressants', 'Store below 30°C', false, 3.00, true, 4.50),

('10000000-0000-0000-0000-000000000030', 'Zyrtec', 'Cetirizine HCl', '10mg', 'Tablet',
 'UCB Pharma', 'Seasonal/perennial allergic rhinitis, chronic urticaria', 'Somnolence, dry mouth', 'Renal impairment (adjust dose)',
 'Theophylline, CNS depressants', 'Store below 30°C', false, 10.00, false, 4.80),

('10000000-0000-0000-0000-000000000031', 'Loratadine', 'Loratadine', '10mg', 'Tablet',
 'Generic', 'Allergic rhinitis, urticaria', 'Headache, drowsiness (low risk)', 'Hypersensitivity to loratadine',
 'Cimetidine, ketoconazole', 'Store below 25°C', false, 3.50, true, 4.40),

('10000000-0000-0000-0000-000000000032', 'Fexofenadine', 'Fexofenadine HCl', '120mg', 'Tablet',
 'Generic', 'Seasonal allergic rhinitis, chronic idiopathic urticaria', 'Headache, back pain, nausea', 'Hypersensitivity to terfenadine',
 'Antacids, erythromycin, ketoconazole', 'Store below 30°C', false, 8.00, true, 4.60),

-- ─── Gastro / Antacids ────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000033', 'Omeprazole', 'Omeprazole', '20mg', 'Capsule',
 'Generic', 'GERD, peptic ulcer, Zollinger-Ellison syndrome, H. pylori', 'Headache, diarrhea, abdominal pain', 'Hypersensitivity to PPIs',
 'Clopidogrel, warfarin, methotrexate', 'Store below 25°C', true, 5.00, true, 4.60),

('10000000-0000-0000-0000-000000000034', 'Losectil', 'Omeprazole', '20mg', 'Capsule',
 'Square Pharma', 'GERD, peptic ulcer disease', 'Nausea, flatulence, diarrhea', 'CYP2C19 poor metabolizers (adjust dose)',
 'Clopidogrel, iron salts', 'Store below 30°C', true, 12.00, false, 4.80),

('10000000-0000-0000-0000-000000000035', 'Pantoprazole', 'Pantoprazole Sodium', '40mg', 'Tablet',
 'Generic', 'GERD, erosive esophagitis, H. pylori eradication', 'Headache, diarrhea, hypomagnesemia', 'PPI hypersensitivity',
 'Warfarin, methotrexate', 'Store below 25°C, protect from moisture', true, 8.00, true, 4.50),

('10000000-0000-0000-0000-000000000036', 'Antacid', 'Aluminium Hydroxide + Magnesium Hydroxide', '200mg/200mg', 'Tablet',
 'Generic', 'Heartburn, acid indigestion, stomach upset', 'Constipation (Al) or diarrhea (Mg)', 'Renal failure, hypophosphatemia',
 'Fluoroquinolones, tetracycline (reduces absorption)', 'Store below 30°C', false, 2.00, true, 4.00),

('10000000-0000-0000-0000-000000000037', 'Ranitidine', 'Ranitidine HCl', '150mg', 'Tablet',
 'Generic', 'Duodenal/gastric ulcers, GERD, Zollinger-Ellison', 'Headache, dizziness, constipation', 'Hypersensitivity to ranitidine',
 'Warfarin, antacids, gefitinib', 'Store below 25°C, protect from light', true, 4.00, true, 4.20),

('10000000-0000-0000-0000-000000000038', 'Domperidone', 'Domperidone', '10mg', 'Tablet',
 'Generic', 'Nausea, vomiting, gastroparesis', 'QT prolongation, dry mouth', 'QT prolongation, hepatic impairment',
 'Ketoconazole, erythromycin, CYP3A4 inhibitors', 'Store below 30°C', true, 3.50, true, 4.30),

-- ─── Lipid-Lowering ───────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000039', 'Atorvastatin', 'Atorvastatin Calcium', '20mg', 'Tablet',
 'Generic', 'Hyperlipidemia, cardiovascular disease prevention', 'Myalgia, elevated liver enzymes, rhabdomyolysis (rare)', 'Active liver disease, pregnancy',
 'Cyclosporine, clarithromycin, grapefruit juice', 'Store below 30°C', true, 6.00, true, 4.60),

('10000000-0000-0000-0000-000000000040', 'Lipitor', 'Atorvastatin Calcium', '20mg', 'Tablet',
 'Pfizer', 'Prevention of cardiovascular events, hypercholesterolemia', 'Muscle pain, liver enzyme elevation', 'Hypersensitivity to atorvastatin',
 'Azole antifungals, macrolide antibiotics', 'Store below 30°C', true, 25.00, false, 4.90),

('10000000-0000-0000-0000-000000000041', 'Rosuvastatin', 'Rosuvastatin Calcium', '10mg', 'Tablet',
 'Generic', 'Primary hyperlipidemia, atherosclerosis prevention', 'Myopathy, headache, abdominal pain', 'Active liver disease, pregnancy',
 'Antacids, cyclosporine, gemfibrozil', 'Store below 30°C', true, 12.00, true, 4.70),

-- ─── Respiratory ──────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000042', 'Salbutamol', 'Salbutamol Sulfate', '100mcg/dose', 'Inhaler',
 'Generic', 'Bronchospasm in asthma and COPD, exercise-induced bronchospasm', 'Tremor, palpitations, tachycardia', 'Hypersensitivity to salbutamol',
 'Beta-blockers, digoxin', 'Store at room temperature, protect from frost', true, 85.00, true, 4.70),

('10000000-0000-0000-0000-000000000043', 'Ventolin', 'Salbutamol Sulfate', '100mcg/dose', 'Inhaler',
 'GSK', 'Acute asthma, COPD bronchospasm', 'Fine tremor, headache, tachycardia', 'Rare: hypersensitivity reactions',
 'MAOIs, tricyclic antidepressants', 'Store below 30°C, keep away from fire', true, 150.00, false, 4.90),

('10000000-0000-0000-0000-000000000044', 'Montelukast', 'Montelukast Sodium', '10mg', 'Tablet',
 'Generic', 'Asthma prophylaxis, allergic rhinitis', 'Headache, abdominal pain, neuropsychiatric events', 'Hypersensitivity to montelukast',
 'Phenobarbital, rifampin', 'Store below 25°C, protect from moisture and light', true, 15.00, true, 4.50),

('10000000-0000-0000-0000-000000000045', 'Ambroxol', 'Ambroxol HCl', '30mg', 'Tablet',
 'Generic', 'Respiratory disorders with excessive mucus production', 'Nausea, GI upset, dry mouth', 'Hypersensitivity to ambroxol',
 'Antibiotics (may increase antibiotic penetration in lung)', 'Store below 30°C', false, 5.00, true, 4.40),

-- ─── Vitamins / Supplements ───────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000046', 'Vitamin C', 'Ascorbic Acid', '500mg', 'Tablet',
 'Generic', 'Vitamin C deficiency, scurvy, immune support', 'GI upset, kidney stones at high doses', 'Haemochromatosis',
 'Anticoagulants, chemotherapy drugs', 'Store below 25°C', false, 1.50, true, 4.30),

('10000000-0000-0000-0000-000000000047', 'Vitamin D3', 'Cholecalciferol', '1000 IU', 'Tablet',
 'Generic', 'Vitamin D deficiency, rickets, osteoporosis', 'Hypercalcemia at excessive doses', 'Hypercalcemia, vitamin D toxicity',
 'Thiazide diuretics, digoxin', 'Store below 25°C, protect from light', false, 5.00, true, 4.50),

('10000000-0000-0000-0000-000000000048', 'Folic Acid', 'Folic Acid', '5mg', 'Tablet',
 'Generic', 'Folate deficiency, prevention of neural tube defects in pregnancy', 'Rarely: GI upset', 'Pernicious anemia (can mask B12 deficiency)',
 'Methotrexate, phenytoin, phenobarbital', 'Store below 25°C', false, 1.00, true, 4.60),

('10000000-0000-0000-0000-000000000049', 'Zinc Sulfate', 'Zinc Sulfate', '20mg', 'Tablet',
 'Generic', 'Zinc deficiency, acrodermatitis enteropathica, wound healing', 'Nausea, vomiting, copper deficiency', 'Hypersensitivity to zinc',
 'Tetracyclines, quinolones, iron', 'Store below 25°C', false, 2.00, true, 4.20),

('10000000-0000-0000-0000-000000000050', 'Calcium + Vitamin D', 'Calcium Carbonate + Cholecalciferol', '500mg/250 IU', 'Tablet',
 'Generic', 'Calcium deficiency, osteoporosis, hypocalcemia', 'Constipation, hypercalcemia at high doses', 'Hypercalciuria, nephrolithiasis',
 'Thyroid hormones, bisphosphonates, fluoroquinolones', 'Store below 30°C', false, 4.00, true, 4.40),

-- ─── Antiparasitics ───────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000051', 'Albendazole', 'Albendazole', '400mg', 'Tablet',
 'Generic', 'Intestinal worm infections, neurocysticercosis, hydatid disease', 'Abdominal pain, nausea, elevated liver enzymes', 'Pregnancy (first trimester)',
 'Theophylline, dexamethasone', 'Store below 30°C', true, 15.00, true, 4.50),

('10000000-0000-0000-0000-000000000052', 'Mebendazole', 'Mebendazole', '100mg', 'Tablet',
 'Generic', 'Pinworm, roundworm, hookworm, whipworm', 'Abdominal pain, diarrhea (rare)', 'Pregnancy',
 'Cimetidine, metronidazole', 'Store below 25°C', true, 5.00, true, 4.40),

-- ─── Antifungals ──────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000053', 'Fluconazole', 'Fluconazole', '150mg', 'Capsule',
 'Generic', 'Vaginal candidiasis, oropharyngeal candidiasis, cryptococcal meningitis', 'Nausea, headache, QT prolongation', 'Hypersensitivity to fluconazole, QT prolonging drugs',
 'Warfarin, phenytoin, rifampicin, cisapride', 'Store below 30°C', true, 20.00, true, 4.60),

('10000000-0000-0000-0000-000000000054', 'Clotrimazole Cream', 'Clotrimazole', '1%', 'Topical Cream',
 'Generic', 'Fungal skin infections (ringworm, athlete''s foot, candidiasis)', 'Local irritation, burning, rash', 'Hypersensitivity to clotrimazole',
 'No significant systemic interactions', 'Store below 25°C', false, 25.00, true, 4.30),

-- ─── Corticosteroids ──────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000055', 'Prednisolone', 'Prednisolone', '5mg', 'Tablet',
 'Generic', 'Inflammatory conditions, asthma, allergic disorders, autoimmune diseases', 'Cushing''s syndrome, osteoporosis, hyperglycemia, immunosuppression', 'Active infections (without antimicrobial cover), live vaccines',
 'NSAIDs, anticoagulants, antidiabetics', 'Store below 25°C', true, 3.00, true, 4.40),

('10000000-0000-0000-0000-000000000056', 'Dexamethasone', 'Dexamethasone', '0.5mg', 'Tablet',
 'Generic', 'Severe allergic reactions, cerebral edema, COVID-19 (severe), adrenal insufficiency', 'Hyperglycemia, fluid retention, adrenal suppression', 'Active untreated infections',
 'NSAIDs, phenytoin, rifampicin', 'Store below 30°C', true, 2.00, true, 4.30),

-- ─── Antimalarials ────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000057', 'Chloroquine', 'Chloroquine Phosphate', '250mg', 'Tablet',
 'Generic', 'Malaria treatment and prophylaxis, rheumatoid arthritis, SLE', 'Retinopathy, GI disturbance, QT prolongation', 'Retinal/visual field changes, G6PD deficiency',
 'Antacids, ampicillin, digoxin', 'Store below 25°C, protect from light', true, 5.00, true, 4.20),

('10000000-0000-0000-0000-000000000058', 'Artemether + Lumefantrine', 'Artemether/Lumefantrine', '20mg/120mg', 'Tablet',
 'Generic', 'Uncomplicated Plasmodium falciparum malaria', 'Headache, dizziness, fatigue, QT prolongation', 'Hypersensitivity, severe hepatic impairment',
 'QT-prolonging drugs, CYP3A4 inducers/inhibitors', 'Store below 30°C, protect from moisture', true, 50.00, true, 4.70),

-- ─── Thyroid ──────────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000059', 'Levothyroxine', 'Levothyroxine Sodium', '50mcg', 'Tablet',
 'Generic', 'Hypothyroidism, thyroid hormone replacement, goiter', 'Tachycardia, weight loss, insomnia at excessive doses', 'Untreated adrenal insufficiency, thyrotoxicosis',
 'Calcium, iron, antacids (reduce absorption), warfarin', 'Store below 25°C, protect from light and moisture', true, 5.00, true, 4.60),

('10000000-0000-0000-0000-000000000060', 'Propylthiouracil', 'Propylthiouracil', '50mg', 'Tablet',
 'Generic', 'Hyperthyroidism, Graves'' disease, pre-operative thyrotoxicosis', 'Agranulocytosis, hepatotoxicity, rash', 'Pregnancy (especially 2nd/3rd trimester)',
 'Warfarin, beta-blockers, digoxin', 'Store below 25°C', true, 8.00, true, 4.20),

-- ─── Cardiovascular ───────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000061', 'Aspirin', 'Acetylsalicylic Acid', '75mg', 'Tablet',
 'Generic', 'Antiplatelet therapy, cardiovascular disease prevention, fever, pain', 'GI bleeding, tinnitus, Reye syndrome (children)', 'Children under 16, bleeding disorders, active peptic ulcer',
 'Warfarin, NSAIDs, methotrexate', 'Store below 25°C, keep dry', false, 1.50, true, 4.50),

('10000000-0000-0000-0000-000000000062', 'Clopidogrel', 'Clopidogrel Bisulfate', '75mg', 'Tablet',
 'Generic', 'ACS prevention, post-stenting, stroke prevention', 'Bleeding, bruising, GI upset', 'Active bleeding, peptic ulcer',
 'Omeprazole, warfarin, aspirin', 'Store below 25°C', true, 15.00, true, 4.60),

('10000000-0000-0000-0000-000000000063', 'Digoxin', 'Digoxin', '0.25mg', 'Tablet',
 'Generic', 'Heart failure, atrial fibrillation/flutter', 'Digoxin toxicity (nausea, bradycardia, visual disturbances)', 'Ventricular fibrillation, WPW syndrome',
 'Amiodarone, verapamil, quinidine, diuretics', 'Store below 25°C, protect from light', true, 5.00, true, 4.30),

('10000000-0000-0000-0000-000000000064', 'Furosemide', 'Furosemide', '40mg', 'Tablet',
 'Generic', 'Edema, hypertension, pulmonary edema, heart failure', 'Hypokalemia, hyponatremia, ototoxicity, dehydration', 'Anuria, severe electrolyte depletion',
 'Digoxin, lithium, NSAIDs, aminoglycosides', 'Store below 25°C, protect from light', true, 3.00, true, 4.40),

-- ─── CNS / Neurological ───────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000065', 'Diazepam', 'Diazepam', '5mg', 'Tablet',
 'Generic', 'Anxiety, seizures, muscle spasm, alcohol withdrawal, sedation', 'Drowsiness, dependence, respiratory depression', 'Myasthenia gravis, severe respiratory insufficiency',
 'Alcohol, CNS depressants, opioids, cimetidine', 'Store below 25°C', true, 2.00, true, 4.00),

('10000000-0000-0000-0000-000000000066', 'Phenytoin', 'Phenytoin Sodium', '100mg', 'Capsule',
 'Generic', 'Epilepsy (tonic-clonic, partial seizures), trigeminal neuralgia', 'Gingival hyperplasia, ataxia, hirsutism, teratogenic', 'Pregnancy (relative), sinus bradycardia',
 'Warfarin, valproate, carbamazepine, isoniazid', 'Store below 30°C, protect from moisture', true, 5.00, true, 4.10),

('10000000-0000-0000-0000-000000000067', 'Carbamazepine', 'Carbamazepine', '200mg', 'Tablet',
 'Generic', 'Epilepsy, trigeminal neuralgia, bipolar disorder', 'Ataxia, diplopia, hyponatremia, hepatotoxicity', 'Bone marrow suppression, MAOIs',
 'Valproate, phenytoin, oral contraceptives, warfarin', 'Store below 25°C', true, 8.00, true, 4.20),

('10000000-0000-0000-0000-000000000068', 'Amitriptyline', 'Amitriptyline HCl', '25mg', 'Tablet',
 'Generic', 'Depression, neuropathic pain, fibromyalgia, migraine prophylaxis', 'Anticholinergic effects, cardiotoxicity, sedation, weight gain', 'MAOIs (within 14 days), recent MI, arrhythmias',
 'MAOIs, sympathomimetics, anticholinergics, alcohol', 'Store below 25°C, protect from light', true, 3.00, true, 4.10),

-- ─── Antidepressants ──────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000069', 'Fluoxetine', 'Fluoxetine HCl', '20mg', 'Capsule',
 'Generic', 'Depression, OCD, panic disorder, bulimia nervosa, PMDD', 'Nausea, insomnia, sexual dysfunction, serotonin syndrome', 'MAOIs (within 14 days), pimozide, thioridazine',
 'MAOIs, triptans, tramadol, lithium, warfarin', 'Store below 25°C', true, 8.00, true, 4.40),

('10000000-0000-0000-0000-000000000070', 'Sertraline', 'Sertraline HCl', '50mg', 'Tablet',
 'Generic', 'Depression, OCD, PTSD, panic disorder, social anxiety', 'Nausea, diarrhea, insomnia, sexual dysfunction', 'MAOIs (within 14 days), pimozide',
 'MAOIs, cimetidine, warfarin, NSAIDs', 'Store below 30°C', true, 12.00, true, 4.50),

-- ─── Urological ───────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000071', 'Tamsulosin', 'Tamsulosin HCl', '0.4mg', 'Capsule',
 'Generic', 'BPH (benign prostatic hyperplasia), ureteral stones', 'Orthostatic hypotension, retrograde ejaculation, dizziness', 'Hypersensitivity, severe hepatic impairment',
 'Phosphodiesterase inhibitors, antihypertensives, strong CYP3A4 inhibitors', 'Store below 30°C', true, 20.00, true, 4.40),

-- ─── Ophthalmic ───────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000072', 'Ciprofloxacin Eye Drop', 'Ciprofloxacin HCl', '0.3%', 'Eye Drops',
 'Generic', 'Bacterial conjunctivitis, corneal ulcers', 'Burning, stinging on instillation', 'Hypersensitivity to quinolones',
 'Minimal systemic interactions', 'Store below 25°C', true, 40.00, true, 4.50),

-- ─── ORS / Rehydration ────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000073', 'ORS', 'Sodium Chloride + Potassium Chloride + Sodium Citrate + Glucose', 'WHO formula', 'Oral Solution',
 'Generic', 'Dehydration from diarrhea and vomiting', 'Hypernatremia if taken without adequate water', 'Severe dehydration requiring IV fluids',
 'No significant interactions', 'Store sachets below 30°C, prepare fresh each time', false, 10.00, true, 4.80),

-- ─── Iron Preparations ────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000074', 'Ferrous Sulfate', 'Ferrous Sulfate', '200mg (65mg elemental iron)', 'Tablet',
 'Generic', 'Iron deficiency anemia', 'Constipation, dark stools, nausea, GI upset', 'Haemochromatosis, haemolytic anemia',
 'Tetracyclines, antacids, levothyroxine, vitamin C (enhances absorption)', 'Store below 25°C', false, 2.00, true, 4.30),

-- ─── Insulin ──────────────────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000075', 'Human Insulin (Regular)', 'Human Insulin', '100 IU/mL', 'Injection',
 'Generic', 'Type 1 & Type 2 diabetes, diabetic ketoacidosis', 'Hypoglycemia, lipodystrophy at injection site', 'Hypoglycemia',
 'Beta-blockers (mask hypoglycemia symptoms), alcohol, salicylates', 'Refrigerate at 2–8°C; do not freeze', true, 200.00, true, 4.70),

('10000000-0000-0000-0000-000000000076', 'Insulin Glargine', 'Insulin Glargine', '100 IU/mL', 'Injection',
 'Sanofi', 'Type 1 & Type 2 diabetes (basal insulin)', 'Hypoglycemia, injection site reactions, weight gain', 'Hypoglycemia',
 'Alcohol, beta-blockers, ACE inhibitors', 'Refrigerate at 2–8°C; in use vials at room temp for 28 days', true, 700.00, false, 4.80),

-- ─── Antimicrobials (Additional) ──────────────────────────────────────────────
('10000000-0000-0000-0000-000000000077', 'Isoniazid', 'Isoniazid', '300mg', 'Tablet',
 'Generic', 'Tuberculosis treatment and prophylaxis', 'Peripheral neuropathy, hepatotoxicity, pyridoxine deficiency', 'Active liver disease, acute alcohol-related liver disease',
 'Rifampicin, phenytoin, alcohol, antacids', 'Store below 25°C, protect from light', true, 3.00, true, 4.40),

('10000000-0000-0000-0000-000000000078', 'Rifampicin', 'Rifampicin', '450mg', 'Capsule',
 'Generic', 'Tuberculosis, leprosy, meningococcal prophylaxis', 'Orange discoloration of body fluids, hepatotoxicity, flu-like syndrome', 'Jaundice, hypersensitivity to rifamycins',
 'Oral contraceptives (reduces efficacy), anticoagulants, antiretrovirals, many others', 'Store below 25°C, protect from moisture and light', true, 15.00, true, 4.50),

-- ─── Analgesics (Opioid) ──────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000079', 'Tramadol', 'Tramadol HCl', '50mg', 'Capsule',
 'Generic', 'Moderate to severe pain, post-operative pain', 'Nausea, constipation, dizziness, dependence, seizures', 'Epilepsy, MAOIs, suicidal risk',
 'MAOIs, SSRIs, TCAs, CNS depressants, alcohol', 'Store below 25°C', true, 10.00, true, 4.20),

-- ─── Immunosuppressants ───────────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000080', 'Hydroxychloroquine', 'Hydroxychloroquine Sulfate', '200mg', 'Tablet',
 'Generic', 'Rheumatoid arthritis, SLE, malaria prophylaxis', 'Retinopathy, GI upset, cardiomyopathy, QT prolongation', 'Retinal/visual field changes, G6PD deficiency',
 'Digoxin, antacids, ampicillin, QT-prolonging drugs', 'Store below 30°C, protect from light', true, 18.00, true, 4.40)

ON CONFLICT (drug_id) DO UPDATE SET
  brand_name            = EXCLUDED.brand_name,
  salt_composition      = EXCLUDED.salt_composition,
  strength              = EXCLUDED.strength,
  dosage_form           = EXCLUDED.dosage_form,
  manufacturer          = EXCLUDED.manufacturer,
  uses                  = EXCLUDED.uses,
  side_effects          = EXCLUDED.side_effects,
  contraindications     = EXCLUDED.contraindications,
  drug_interactions     = EXCLUDED.drug_interactions,
  storage_instructions  = EXCLUDED.storage_instructions,
  prescription_required = EXCLUDED.prescription_required,
  estimated_price       = EXCLUDED.estimated_price,
  is_generic            = EXCLUDED.is_generic,
  trust_rating          = EXCLUDED.trust_rating;
