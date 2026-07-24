# Phase 06
# Database Design & Data Model

---

# 6. Database Design

## 6.1 Overview

The MediSync database serves as the central persistent storage layer of the application.

Its primary responsibility is to maintain all structured information required for system operation while ensuring data consistency, integrity, scalability, and security.

The database shall support:

- User management
- Prescription records
- OCR extracted information
- Medicine information
- Reminder schedules
- Pharmacy inventory
- AI conversation history
- Audit logs

Uploaded prescription images shall **not** be stored directly inside the relational database. Instead, they shall be stored in object storage, while the database maintains references to those files.

---

# 6.2 Database Principles

The database shall follow these principles:

### Normalization

Data should be normalized to reduce redundancy while maintaining acceptable query performance.

---

### Referential Integrity

Relationships between entities shall be enforced using foreign keys whenever appropriate.

---

### Scalability

The schema should allow future modules to be added without requiring major restructuring.

Examples include:

- Doctor Portal
- Pharmacy Dashboard
- Electronic Health Records
- Insurance Integration

---

### Soft Deletion

Whenever practical, records should be marked as inactive instead of being permanently deleted.

This improves auditing and recovery.

---

### Auditability

Important records should maintain:

- Created At
- Updated At
- Deleted At (optional)
- Created By (future)
- Updated By (future)

---

# 6.3 Core Entities

The MVP shall contain the following primary entities.

| Entity | Purpose |
|----------|----------|
| User | Patient account information |
| Prescription | Uploaded prescription metadata |
| PrescriptionMedicine | Medicines extracted from prescriptions |
| Medicine | Master medicine database |
| Reminder | Medication reminder schedules |
| ReminderLog | Reminder completion history |
| Pharmacy | Partner pharmacies |
| Inventory | Pharmacy medicine availability |
| AIConversation | AI chat sessions |
| AIMessage | Messages exchanged with AI |

Future entities may include:

- Doctor
- Appointment
- Hospital
- Insurance
- Drug Interaction Database

---

# 6.4 Entity Relationship Overview

```

User
│
├── Prescription
│       │
│       └── PrescriptionMedicine
│
├── Reminder
│       │
│       └── ReminderLog
│
└── AIConversation
        │
        └── AIMessage

Medicine
│
├── PrescriptionMedicine
│
└── Inventory

Pharmacy
│
└── Inventory

```

---

# 6.5 User Entity

The User entity stores patient account information.

Example fields include:

- User ID
- Full Name
- Email
- Password Hash
- Date of Birth
- Phone Number
- Profile Image
- Notification Preferences
- Account Status
- Created At
- Updated At

Each user may own multiple prescriptions.

---

# 6.6 Prescription Entity

The Prescription entity stores metadata related to uploaded prescriptions.

Example fields include:

- Prescription ID
- User ID
- Upload Timestamp
- Image URL
- OCR Status
- AI Processing Status
- Review Status
- Notes

Each prescription belongs to exactly one user.

---

# 6.7 PrescriptionMedicine Entity

This table represents medicines extracted from a prescription.

Each record represents a single medicine.

Example fields:

- Medicine Entry ID
- Prescription ID
- Medicine ID (nullable)
- Medicine Name (OCR Result)
- Generic Name
- Dosage
- Frequency
- Duration
- Timing Instructions
- User Corrected Flag

The OCR result should remain editable until confirmed by the user.

---

# 6.8 Medicine Entity (Knowledge Base)

The Medicine entity acts as the master medical knowledge repository. It stores rich, verified medical information that is used by the system to perform deterministic lookups and to ground LLM-generated explanations.

Fields include:
- **Medicine ID**: Unique primary key
- **Brand Name**: Brand under which the drug is sold
- **Generic Name**: Active chemical name
- **Strength**: Dosage concentration (e.g., 500mg, 10ml)
- **Uses**: Verified clinical indications
- **Warnings**: Critical precautions and warnings
- **Side Effects**: Common and severe side effects
- **Pregnancy**: Safety guidelines for pregnancy and lactation
- **Interactions**: Key drug-to-drug interactions
- **Storage**: Storage conditions (e.g., store below 25°C)
- **Manufacturer**: Pharma company producing the medicine
- **Reference Source**: Source of medical truth (e.g., BNF, DGDA, WHO)
- **Last Updated**: Audit timestamp of the last verification

This database entity is shared across the entire application and is maintained by administrators.

---

## 6.8.1 Knowledge Retrieval Strategy

To prevent AI hallucination and ensure patient safety, explanations are generated using structured facts retrieved directly from the Medicine Knowledge Base:

```text
Medicine Question
       │
       ▼
Retrieve from DB (Uses, Side Effects, Warnings, Storage, etc.)
       │
       ▼
Build Prompt (System instructions + retrieved DB facts + user context)
       │
       ▼
Medical LLM (Simplifies and summarizes facts into patient-friendly language)
```

By retrieving facts from the database and using the LLM strictly as an explanation synthesizer, the system avoids generating incorrect medical advice.

---

# 6.9 Reminder Entity

Reminder schedules generated from prescriptions shall be stored separately from prescriptions.

Example fields include:

- Reminder ID
- User ID
- Prescription Medicine ID
- Reminder Time
- Reminder Frequency
- Start Date
- End Date
- Reminder Status

Separating reminders allows users to customize reminder schedules without modifying the original prescription.

---

# 6.10 Reminder Log

Reminder logs record medication adherence.

Example fields:

- Reminder Log ID
- Reminder ID
- Scheduled Time
- Actual Completion Time
- Status

Possible status values:

- Taken
- Skipped
- Missed

Reminder history should remain immutable.

---

# 6.11 Pharmacy Entity

Stores partner pharmacy information.

Example fields:

- Pharmacy ID
- Pharmacy Name
- Address
- Contact Number
- Operating Hours
- Verification Status

Only verified pharmacies shall appear in medicine searches.

---

# 6.12 Inventory Entity

Tracks medicine availability.

Example fields:

- Inventory ID
- Pharmacy ID
- Medicine ID
- Stock Quantity
- Unit Price
- Availability Status
- Last Updated

Inventory shall support real-time updates.

---

# 6.13 AI Conversation

Stores AI conversation metadata.

Example fields:

- Conversation ID
- User ID
- Created At
- Last Activity

Conversation metadata should be separated from message content.

---

# 6.14 AI Message

Stores messages exchanged between users and the AI assistant.

Example fields:

- Message ID
- Conversation ID
- Sender
- Message
- Timestamp

Sensitive medical information should only be retained as necessary to support user functionality and applicable privacy requirements.

---

# 6.15 Data Ownership

Each entity shall have a clearly defined owner.

| Entity | Owner |
|----------|--------|
| User | Patient |
| Prescription | Patient |
| Reminder | Patient |
| Reminder Log | System |
| AI Conversation | Patient |
| AI Message | Patient |
| Pharmacy | Pharmacy |
| Inventory | Pharmacy |
| Medicine | Administrator |

Ownership determines authorization and access control.

---

# 6.16 Data Retention

The system should retain data according to the following principles.

Prescription records:

- Retained until user deletion request or applicable legal requirements.

Reminder history:

- Retained for adherence tracking.

AI conversations:

- Retained only as long as necessary for user experience and applicable privacy policies.

System logs:

- Retained according to operational policies.

Future deployments should support configurable retention policies.

---

# 6.17 Database Indexing Strategy

Indexes should be created for frequently queried fields.

Examples include:

- User Email
- Medicine Name
- Generic Name
- Pharmacy Name
- Reminder Time
- User ID
- Prescription ID

Composite indexes may be introduced based on observed query patterns.

---

# 6.18 Transactions

Database transactions should be used whenever multiple related operations occur.

Example:

Uploading a prescription should:

1. Create Prescription.
2. Store OCR Result.
3. Create Medicines.
4. Generate Reminders.

If any step fails, the transaction should prevent partial data persistence where appropriate.

---

# 6.19 Data Consistency

The system shall maintain consistency by:

- Enforcing foreign key constraints.
- Preventing orphan records.
- Validating entity relationships.
- Maintaining unique identifiers.
- Preventing duplicate user accounts.

---

# 6.20 Future Database Expansion

The schema should support future modules without major redesign.

Examples include:

- Electronic Health Records
- Doctor Accounts
- Appointment Scheduling
- Prescription Sharing
- Laboratory Reports
- Insurance Claims
- Wearable Device Integration

---

# Phase Summary

The database architecture of MediSync is designed around modular, normalized entities with clear ownership and relationships. By separating users, prescriptions, medicines, reminders, pharmacies, and AI conversations into dedicated entities, the system remains scalable, maintainable, and adaptable to future healthcare features. Uploaded medical documents are stored separately in object storage, while the relational database maintains structured metadata and relationships required for efficient querying and long-term data integrity.
