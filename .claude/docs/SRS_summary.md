# SRS Summary — Medgulf Smart Assistant

Quick reference for Claude Code. Full SRS is in the project files (Medgulf_SRS_v1.docx).

---

## In Scope (this build)
- US-001: Smart Assistant initiation + document upload
- US-002: OCR analysis + processing steps display
- US-003: Review, correction, policy validation, IBAN
- US-004: Final submission + risk flagging
- US-005: Post-submission notification awareness

## Out of Scope
- US-006: Claim History
- US-007: Claim Resubmission

---

## Data Points (Claim Object)

| Field | Type | Source | Required |
|---|---|---|---|
| `claimant_name` | String | OCR/User | Yes |
| `policy_number` | String | Database | Yes (read-only) |
| `provider_name` | String | OCR/User | Yes |
| `provider_country` | String | OCR/User | Yes |
| `service_date` | Date | OCR/User | Yes |
| `claim_notes` | String | LLM/User | No |
| `benefit_category` | String | Database | Yes (read-only) |
| `diagnosis_code` | String | OCR/User | No |
| `service_code` | String | OCR/User/MG | No |
| `claim_amount` | Currency | OCR/User | Yes |
| `VAT` | Currency | OCR/User | No |
| `deductible` | Currency | OCR/User | No |
| `IBAN` | String (24 chars) | Database/User | Yes |
| `geo_check_status` | Boolean | System | System-set |
| `is_user_edited` | Boolean | System | System-set |
| `is_doc_unclear` | Boolean | System | System-set |
| `is_service_uncovered` | Boolean | System | System-set |

---

## Key Business Rules for Frontend

### Document Upload
- Accept: PDF, JPG, PNG only. Max 10MB per file.
- Minimum batch: 1 Invoice + 1 Medical Report OR Prescription
- Enforce client-side — disable "Upload & Analyse" until met

### Claimant Selection
- Primary insured: show self + all dependents if claimant name unclear in doc
- Non-primary: auto-confirm as themselves (no selector needed)

### Form Editing
- `is_user_edited = true` the moment any OCR field is changed
- Manual input always overrides OCR
- Submission blocked if any required field is null

### IBAN Logic
- 0 saved IBANs → show new IBAN input
- 1 saved IBAN → show masked IBAN with "Use this" + "Use different" option
- 2+ saved IBANs → show dropdown + "Add new" option
- New IBAN: 24 chars, alphanumeric, starts with country code
- n8n verifies with bank — if fails, re-prompt (same widget, new resumeUrl)

### Warning Banners (user can proceed but claim is flagged)
- Geo fail: provider location outside covered region
- Coverage fail: service not in policy benefits
- Unclear doc: document failed OCR quality check
- All three show: "Submit Anyway" + "Discard Claim" options

### Financial Summary
- Always show: "This is an estimate and not a guarantee of payment."
- Never remove or hide this disclaimer

### Post-Submission
- Claim thread becomes read-only immediately
- Input bar permanently disabled
- `processing_type` is transparent to user — handled internally by n8n

---

## Notification Templates (US-005)
Frontend displays these in the in-app notification centre. **No PHI in notification text.**

| Status | Message |
|---|---|
| Submitted | "Your reimbursement request has been submitted successfully. It will be processed within XX days." |
| Under Review | "Your request is currently under review. Note: deductible and VAT will not be reimbursed if approved." |
| Additional Info Required | "We require additional information to continue processing your request." |
| Approved | "Your reimbursement request has been approved and will be processed within XX days." |
| Rejected | "Your request has been reviewed and could not be approved." |
| Payment Processed | "Your payment has been processed successfully and transferred to your registered bank account." |

*XX days = placeholder — to be filled by product team before launch.*

---

## Acceptance Criteria Summary

### US-001 ✓ when:
- User can upload PDF/JPG/PNG up to 10MB
- File type/size errors shown inline
- "Upload & Analyse" disabled until Invoice + Report/Prescription present
- Assistant shows greeting with user's first name

### US-002 ✓ when:
- ProcessingSteps widget animates through all 6 steps during OCR
- ExtractedDataForm renders with pre-filled data after OCR
- Unclear document triggers re-upload option

### US-003 ✓ when:
- All data points editable except policy_number and benefit_category
- is_user_edited set on any field change
- Mandatory fields block form confirmation
- WarningBanner appears on geo/coverage failure
- IbanInputWidget handles 0/1/2+ saved IBAN scenarios

### US-004 ✓ when:
- Financial summary shows all amounts + disclaimer
- Submit triggers Stage 4 webhook
- SubmissionSuccessCard shows UCRN claim ID
- Thread becomes read-only after submission

### US-005 ✓ when:
- Post-submission message sets notification expectations
- In-app notification centre icon present in header
- No PHI in any notification-visible text
