# Webhook Payloads — Quick Reference

All calls go through `src/services/webhookService.js`. See CLAUDE.md for the function signatures.

---

## Stage 1 — Initial Document Upload

**Endpoint:** `POST ${VITE_WEBHOOK_BASE_URL}${VITE_INITIAL_WEBHOOK_PATH}`

**Request:**
```json
{
  "user_id": "string",
  "policy_number": "string",
  "session_token": "string",
  "language": "ar | en",
  "claim_notes": "string (may be empty)",
  "documents": ["base64string", "base64string"],
  "document_types": ["invoice", "prescription"]
}
```

**Response:**
```json
{
  "type": "processing_steps | extracted_form | assistant_text",
  "message": "string",
  "extracted_data": {
    "claimant_name": "string | null",
    "provider_name": "string | null",
    "provider_country": "string | null",
    "service_date": "YYYY-MM-DD | null",
    "diagnosis_code": "string | null",
    "service_code": "string | null",
    "claim_amount": "number | null",
    "VAT": "number | null",
    "deductible": "number | null",
    "claim_notes": "string | null",
    "benefit_category": "string | null",
    "policy_number": "string"
  },
  "ocr_confidence": 0.0,
  "is_doc_unclear": false,
  "resumeUrl": "https://n8n.domain.com/webhook-waiting/uuid"
}
```

---

## Stage 2 — Form Confirmation

**Endpoint:** `POST {resumeUrl}` (from Stage 1 response)

**Request:**
```json
{
  "claimant_name": "string",
  "provider_name": "string",
  "provider_country": "string",
  "service_date": "YYYY-MM-DD",
  "diagnosis_code": "string",
  "service_code": "string",
  "claim_amount": 0.00,
  "VAT": 0.00,
  "deductible": 0.00,
  "claim_notes": "string",
  "is_user_edited": false
}
```

**Response:**
```json
{
  "type": "iban_input | warning_banner | assistant_text",
  "message": "string",
  "geo_check_status": true,
  "is_service_uncovered": false,
  "benefit_category": "string",
  "saved_ibans": [
    { "id": "string", "masked": "SA** **** **** **** ***7", "is_default": true }
  ],
  "resumeUrl": "string"
}
```

---

## Stage 3 — IBAN Confirmation

**Endpoint:** `POST {resumeUrl}` (from Stage 2 response)

**Request:**
```json
{
  "iban": "SA000000000000000000000",
  "iban_action": "use_existing | new_iban"
}
```

**Response (success):**
```json
{
  "type": "financial_summary",
  "iban_verified": true,
  "estimated_payout": 0.00,
  "processing_type": "Standard | Manual_Review_Required",
  "currency": "SAR",
  "claim_amount": 0.00,
  "VAT": 0.00,
  "deductible": 0.00,
  "resumeUrl": "string"
}
```

**Response (IBAN failed):**
```json
{
  "type": "iban_input",
  "iban_verified": false,
  "message": "string",
  "saved_ibans": [],
  "resumeUrl": "string"
}
```

---

## Stage 4 — Final Submission

**Endpoint:** `POST {resumeUrl}` (from Stage 3 response)

**Request:**
```json
{
  "submit_action": "submit | submit_with_flag | discard",
  "user_correction_note": "string (optional)",
  "submission_timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "type": "success_card | assistant_text",
  "claim_id": "UCRN1234567",
  "submission_timestamp": "2025-01-01T00:00:00.000Z",
  "processing_type": "Standard | Manual_Review_Required",
  "message": "string"
}
```

---

## Draft Save (any stage)

**Endpoint:** `POST {resumeUrl}`

**Request:**
```json
{
  "action": "save_draft",
  "draft_state": { }
}
```

---

## Claimant Selector (returned by n8n during Stage 1 flow)

n8n may return this type before OCR if claimant is ambiguous:

```json
{
  "type": "claimant_selector",
  "message": "string",
  "dependents": [
    { "id": "string", "name": "string", "relation": "self | spouse | child" }
  ],
  "resumeUrl": "string"
}
```

**Frontend posts back:**
```json
{
  "selected_claimant_id": "string"
}
```

---

## Error Response (any stage)

n8n may return this at any point:
```json
{
  "type": "assistant_text",
  "message": "Localised error description",
  "is_error": true
}
```
Render as a standard assistant bubble. Show Retry button if `is_error: true`.
