# Database Guide
Version: 1.0

---

# Purpose

This document defines the database design principles, conventions, and best practices used throughout the MediSync project.

The database is the single source of truth for all persistent application data.

This guide applies to all contributors, including AI coding agents.

---

# Design Philosophy

The database should be:

- Reliable
- Predictable
- Normalized
- Maintainable
- Efficient
- Secure

Data integrity always takes priority over convenience.

---

# Core Principles

The database should:

- Eliminate redundant data.
- Maintain referential integrity.
- Minimize duplication.
- Support future scalability.
- Be easy to understand.

Business logic should remain in the application layer whenever possible.

---

# Naming Conventions

## Tables

Use:

- lowercase
- snake_case
- plural nouns

Examples:

```
users

medicines

prescriptions

pharmacies

reminders

medicine_alternatives

pharmacy_inventory
```

Avoid:

```
User

tblUser

MedicineTable

Data
```

---

## Columns

Use:

- lowercase
- snake_case
- descriptive names

Examples:

```
first_name

created_at

updated_at

generic_name

manufacturer_name
```

Avoid abbreviations unless universally accepted.

---

## Primary Keys

Every table should have:

```
id
```

Prefer UUIDs when appropriate.

Avoid exposing sequential IDs publicly.

---

## Foreign Keys

Use descriptive naming.

Examples:

```
user_id

medicine_id

prescription_id

pharmacy_id
```

---

# Timestamp Convention

Every major table should contain:

```
created_at

updated_at
```

Optional:

```
deleted_at
```

for soft deletion.

---

# Soft Deletes

Prefer soft deletes over permanent deletion for user-generated data.

Example:

```
deleted_at
```

Records should not be permanently removed unless required.

---

# Normalization

Target:

Third Normal Form (3NF)

Avoid storing duplicate information.

Examples:

Instead of:

```
Prescription

↓

Medicine Name

Manufacturer

Price
```

Store:

```
Prescription

↓

Medicine ID

↓

Medicine Table
```

---

# Relationships

Use foreign keys to maintain relationships.

Prefer explicit relationships over duplicated values.

Example:

```
User

↓

Prescription

↓

Prescription Medicine

↓

Medicine
```

Avoid storing repeated text whenever possible.

---

# Transactions

Use transactions when multiple operations must succeed together.

Examples:

- Creating prescriptions
- Updating medicine inventory
- Creating reminders
- Recording pharmacy purchases

Never leave the database in a partial state.

---

# Constraints

Use database constraints whenever appropriate.

Examples:

- NOT NULL
- UNIQUE
- FOREIGN KEY
- CHECK
- DEFAULT

Constraints protect data integrity.

---

# Indexing

Create indexes for:

- Frequently searched columns
- Foreign keys
- Unique values
- Lookup fields

Avoid unnecessary indexes.

Every index increases write cost.

---

# Query Guidelines

Queries should:

- Retrieve only required fields.
- Use indexes efficiently.
- Minimize joins when possible.
- Avoid duplicate queries.

Never retrieve unnecessary data.

Avoid:

```
SELECT *
```

Prefer:

```
SELECT
id,
generic_name,
brand_name
```

---

# Pagination

Large datasets should always use pagination.

Never return thousands of records in one request.

---

# Migrations

Every schema modification requires a migration.

Never modify production schemas manually.

Migration files should be:

- Versioned
- Reviewed
- Reversible

---

# Seed Data

Use seed files for:

- Development
- Testing
- Demo environments

Seed data should never contain real patient information.

---

# Medical Knowledge Database

The medicine database is a knowledge repository.

Store structured information such as:

- Generic Name
- Brand Name
- Strength
- Dosage Form
- Manufacturer
- Uses
- Contraindications
- Warnings
- Side Effects
- Drug Interactions
- Pregnancy Category
- Storage Instructions
- Availability Status
- Last Updated
- Reference Source

Store structured knowledge whenever possible instead of relying solely on AI.

---

# Prescription Storage

Store:

- Original uploaded image
- OCR extracted text
- Parsed medicines
- Confidence score
- Processing status

Avoid storing only AI-generated interpretations.

---

# Reminder Storage

Each reminder should include:

- User
- Medicine
- Dosage
- Frequency
- Start Date
- End Date
- Scheduled Time
- Notification Status

Reminder logic should remain deterministic.

---

# Pharmacy Inventory

Inventory should contain:

- Pharmacy
- Medicine
- Current Stock
- Unit Price
- Last Updated

Availability should be determined using database queries whenever possible.

---

# AI Cache

Frequently repeated AI responses may be cached.

Cache should include:

- Query Hash
- Response
- Timestamp
- Expiration

Cache should never replace authoritative medical data.

---

# Data Integrity

Always validate:

- Foreign keys
- Duplicate entries
- Required fields
- Unique constraints

Invalid data should never enter the database.

---

# Performance Guidelines

Prefer:

- Indexed lookups
- Batch operations
- Transactions
- Efficient joins

Avoid:

- N+1 queries
- Full table scans
- Duplicate database calls
- Unnecessary writes

Measure performance before optimizing.

---

# Security

Never store:

- Plaintext passwords
- API Keys
- Authentication secrets

Sensitive data should always be protected.

---

# Backup Strategy

The database should support:

- Automated backups
- Point-in-time recovery
- Migration rollback
- Disaster recovery

Backups should be tested periodically.

---

# AI Usage Policy

The database is the primary knowledge source.

Before calling AI:

1. Check database.
2. Retrieve structured information.
3. Build context.
4. Call AI only if additional reasoning is required.

Prefer structured retrieval over AI generation.

---

# Documentation

Whenever database changes occur:

Update:

- Schema documentation
- ER Diagram
- Migration history
- API documentation
- Related Architecture documentation

Documentation should always match the current schema.

---

# Database Review Checklist

Before merging database changes:

✓ Naming conventions followed

✓ Relationships validated

✓ Constraints added

✓ Indexes reviewed

✓ Migrations created

✓ Seed data updated if required

✓ Documentation updated

✓ No duplicate data introduced

✓ Queries optimized

✓ Security preserved

---

# Final Principle

The database is the foundation of MediSync.

Store facts in the database.

Use AI to interpret facts—not to replace them.
