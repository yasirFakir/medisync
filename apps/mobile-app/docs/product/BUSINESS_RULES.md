# MediSync Business Rules & Calculation Specs

---

## 1. Generic Alternative Ranking Algorithm

Finding alternatives for a prescribed medication uses deterministic scoring. AI is **NEVER** used to calculate alternative prices or rankings.

### Formula & Weights
```
Score = (Weight_SameStrength) + (Weight_SameDosageForm) + (PriceSavingsScore) + (TrustScore) + (GenericBonus)
```

| Factor | Weight / Max Points | Calculation Rule |
| :--- | :--- | :--- |
| **Exact Strength Match** | 30 points | If normalized strength matches source drug (e.g. `500mg` == `500mg`) |
| **Exact Dosage Form Match** | 15 points | If normalized dosage form matches (e.g. `tablet` == `tablet`) |
| **Price Savings Contribution**| 25 points | `(abs(PriceDifferencePercent) / 100) * 25` (only applies if candidate price < source price) |
| **Trust Rating Contribution** | 25 points | `(trustRating / 5.0) * 25` |
| **Generic Drug Bonus** | 5 points | Applied if `isGeneric == true` |

### Normalization Rules
- **Strength Normalization:** Strips all whitespace, lowercases, and standardizes unit formats (e.g. `"500 mg"` $\rightarrow$ `"500mg"`, `"10 MG"` $\rightarrow$ `"10mg"`).
- **Dosage Form Normalization:** Lowercases and trims leading/trailing spaces (e.g. `" Tablet "` $\rightarrow$ `"tablet"`).
- **Comparison Limits:** Minimum 2 drugs, Maximum 5 drugs per comparison call.

---

## 2. Dynamic OTP Access Control Rules

### Security Mechanism
- Uses **TOTP (RFC 6238)** with HMAC-SHA1 via `speakeasy`.
- **Token Validity Window:** 30 seconds epoch with $\pm 1$ step tolerance (allowing clock skew up to 60 seconds).
- **Step Window:** 6 digits numerical (`[0-9]{6}`).
- **Access Scope:** Verifying an OTP grants one-time time-bounded access to read the patient's EHR timeline or prescription list.

---

## 3. Pharmacy POS & Inventory Rules

### Stock Deductions & Atomic Transactions
1. **Quantity Constraints:** Sale items cannot exceed available stock in `pharmacy_inventory`.
2. **Calculations:**
   - $\text{Line Total} = \text{Unit Selling Price} \times \text{Quantity}$
   - $\text{Subtotal} = \sum(\text{Line Totals})$
   - $\text{Net Total} = \text{Subtotal} - \text{Discount Amount} + \text{Tax Amount}$
   - $\text{Total Cost} = \sum(\text{Unit Cost Price} \times \text{Quantity})$
3. **Invoice Generation:** Automatic generation of unique invoice code formatted as `INV-YYYYMMDD-XXXX` (e.g., `INV-20260815-A4F9`).
4. **Supported Payment Gateways:** `CASH`, `CARD`, `BKASH`, `NAGAD`, `ROCKET`.

---

## 4. AI Clinical Safety & Urgency Classification Rules

### AI Guardrails
- **Zero Diagnosis Mandate:** AI symptom triage chatbot must explicitly declare itself as a non-diagnostic educational assistant.
- **Urgency Levels:**
  - `CRITICAL`: Immediate emergency protocols advised (severe chest pain, breathing arrest, stroke indicators).
  - `HIGH`: Urgent clinical care within hours required.
  - `MEDIUM`: Non-emergency consultation within 24-48 hours advised.
  - `LOW`: Routine home care, OTC guidance, or general precautions.
- **Deterministic Offline Fallback:** If the Gemini microservice fails or is unreachable, the system must gracefully fall back to local rule-based safety responses without crashing.
