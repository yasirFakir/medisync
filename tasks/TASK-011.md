# TASK-011.md

**Task ID:** TASK-011

**Title:** Pharmacy Review & Rating System (Future Phase — Verified Order Prerequisite)

**Priority:** Medium (Future Feature Iteration)

**Status:** Todo (Blocked until Pharmacy E-Commerce / Order Fulfillment Site module is completed)

**Estimated Time:** 6–8 Hours

**Owner:** Unassigned

---

# Objective

Implement a pharmacy review and rating system that enables patients to review partner pharmacies.

**Prerequisite Enforcement:** A patient **MUST** buy a medicine or fulfill an order from the pharmacy (`order_status = 'FULFILLED'` / verified purchase transaction) before they are allowed to submit a review for that pharmacy.

---

# Background

To prevent spam or fake store ratings, pharmacy reviews will be implemented in a future phase once the pharmacy web portal e-commerce / prescription fulfillment module is fully operational.

Architecture:

```text
Completed Pharmacy Order Fulfillment (order_status = 'FULFILLED')

↓

Verification Gate (Check patient_id + pharmacy_id + order_id)

↓

Review & Rating Submission (1-5 Stars + Service Feedback)

↓

Pharmacy Rating Aggregation Engine

↓

Partner Pharmacy Directory & Cards
```

---

# Scope

Implement the pharmacy review pipeline after the pharmacy order fulfillment system is built.

---

## 1. Verified Purchase Gate (Prerequisite)
* Before allowing a patient to review a pharmacy:
  * Check the pharmacy orders/transactions table for a record where `patient_id = current_user`, `pharmacy_id = target_pharmacy`, and `status = 'FULFILLED'`.
  * If no fulfilled order exists, block review submission with an explanation: *"You can only review a pharmacy after purchasing medicines or fulfilling a prescription order with them."*
  * Limit to **1 review per fulfilled order transaction**.

---

## 2. Review & Rating Criteria
Allow verified purchasers to rate:
* **Overall Pharmacy Rating** (1 to 5 Stars)
* **Category Ratings:**
  * Stock Availability & Medicine Genuine Guarantee (1 to 5 Stars)
  * Service Speed & Pickup Efficiency (1 to 5 Stars)
  * Pricing Fairness & Discount Compliance (1 to 5 Stars)
  * Staff Professionalism (1 to 5 Stars)
* Detailed text feedback comment.

---

## 3. Rating Aggregation & UI Display
* Compute and update on pharmacy directory cards ([`PharmaciesPage.tsx`](file:///home/yasir/Data/dev/Projects/medisync/apps/web-portals/src/pages/PharmaciesPage.tsx)):
  * Average star rating score (e.g. ⭐ 4.8 / 5.0)
  * Total verified customer reviews count
  * Verified Buyer badge indicator on review list items
* Design System Tokens: Follow MediSync Design System styling (`Plus Jakarta Sans` font, Amber `#F59E0B` for star accents, Slate `#3d4947` for text, Level 1 elevation cards `#ffffff`).

---

## 4. Pharmacy Manager Response
Allow pharmacy managers to:
* View customer reviews on their Pharmacy Inventory Portal ([`InventoryPage.tsx`](file:///home/yasir/Data/dev/Projects/medisync/apps/web-portals/src/pages/InventoryPage.tsx)).
* Submit an official store response to customer feedback.

---

# API Endpoints

```text
POST   /api/reviews/pharmacy               - Submit a verified pharmacy review (Patient)
GET    /api/reviews/pharmacy/:pharmacyId   - Get reviews & rating summary for pharmacy
GET    /api/reviews/pharmacy/eligible      - List fulfilled orders eligible for review
POST   /api/reviews/pharmacy/:id/response  - Submit official pharmacy response (Pharmacy Manager)
```

---

# Database Impact

```sql
CREATE TABLE pharmacy_reviews (
  review_id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  pharmacy_id VARCHAR(36) NOT NULL REFERENCES pharmacies(pharmacy_id),
  order_id VARCHAR(36) UNIQUE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  stock_rating INT CHECK (stock_rating >= 1 AND stock_rating <= 5),
  service_speed_rating INT CHECK (service_speed_rating >= 1 AND service_speed_rating <= 5),
  pricing_rating INT CHECK (pricing_rating >= 1 AND pricing_rating <= 5),
  comment TEXT,
  pharmacy_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

# Acceptance Criteria

* Patient CANNOT review a pharmacy without a verified fulfilled purchase transaction.
* Patient CAN submit a review for a completed order fulfillment.
* Duplicate reviews for the same order are rejected.
* Pharmacy directory cards display updated star ratings and total review counts.
* Pharmacy managers can view feedback and post official store replies.
