# Webhook Payloads — Quick Reference

All calls go through `src/services/webhookService.js`. Single endpoint for everything.

**Endpoint:** `POST ${VITE_WEBHOOK_BASE_URL}/webhook/claim-chat`

---

## Request envelope

### Free-text message (intent classifier path)
```json
{
  "session_id": "string",
  "user_id": "string",
  "language": "en | ar",
  "message": "string"
}
```

### Structured UI action (bypasses intent classifier)
```json
{
  "session_id": "string",
  "user_id": "string",
  "language": "en | ar",
  "action": "string",
  "payload": {}
}
```

> Use `message` for freetext only. Use `action` + `payload` for all widget submissions.

---

## Response envelope (always the same shape)
```json
{
  "output": "string",
  "updated_stage": "string",
  "updated_claim": {}
}
```

- `output` — assistant text to render as a chat bubble
- `updated_stage` — new flow state; drives which widget to render next
- `updated_claim` — partial claim object; merged into `claimData` in `ClaimContext`

---

## S1_BENEFIT_SELECTOR

**Trigger:** any initial freetext (e.g. "Submit a claim")

**updated_claim shape:**
```json
{
  "dependents": [
    { "id": "string", "name": "string", "relation": "self | spouse | child", "relation_label": "string", "date_of_birth": "string", "gender": "string" }
  ],
  "benefit_types": [
    { "value": "DENTAL", "label": "Dental" }
  ]
}
```

**Frontend posts back — action `BENEFIT_SELECTED`:**
```json
{
  "action": "BENEFIT_SELECTED",
  "payload": {
    "benefit_type": "DENTAL",
    "for_dependent_id": "dep-123",
    "for_dependent_name": "Sarah Smith"
  }
}
```

---

## S2_DOC_UPLOAD

**updated_claim shape:**
```json
{
  "benefit_type": "DENTAL",
  "for_dependent_id": "dep-123",
  "for_dependent_name": "Sarah Smith",
  "required_docs": [
    { "key": "INVOICE", "label": "Invoice", "description": "string", "required": true }
  ]
}
```

**Frontend posts back — action `DOCUMENTS_UPLOADED`:**

Files are uploaded to the file service first; only URL references are sent here.
```json
{
  "action": "DOCUMENTS_UPLOADED",
  "payload": {
    "documents": [
      { "url": "string", "mimetype": "image/jpeg", "filename": "invoice.jpg", "document_type": "INVOICE" }
    ]
  }
}
```

---

## S3_OCR_REVIEW

**updated_claim shape:**
```json
{
  "extracted_data": {
    "claimant_name": "string",
    "provider_name": "string",
    "provider_country": "string (ISO 3166-1 alpha-3)",
    "service_date": "DD/MM/YYYY",
    "diagnosis_code": ["string"],
    "service_code": "string",
    "claim_amount": 0.00,
    "VAT": 0.00,
    "deductible": 0.00,
    "claim_notes": "string | null",
    "benefit_category": "string",
    "image_snippets": {}
  },
  "ocr_confidence": 0.95,
  "is_doc_unclear": false
}
```

**Frontend posts back — action `OCR_CONFIRMED`:**
```json
{
  "action": "OCR_CONFIRMED",
  "payload": {
    "extracted_data": { "...same fields, edited or not..." },
    "is_user_edited": true
  }
}
```

**User freetext correction (no action):**
```json
{ "message": "The amount should be 450 not 1500" }
```
Response stays at `updated_stage: "S3_OCR_REVIEW"`.

---

## S4_IBAN

**updated_claim shape:**
```json
{
  "saved_ibans": [
    { "iban": "SA1234...", "bankName": "Riyad Bank" }
  ]
}
```

**Frontend posts back — action `IBAN_SELECTED`:**

Saved IBAN:
```json
{
  "action": "IBAN_SELECTED",
  "payload": { "iban": "SA1234...", "iban_action": "saved" }
}
```

New IBAN:
```json
{
  "action": "IBAN_SELECTED",
  "payload": { "iban": "SA9876...", "bank_name": "Al Rajhi", "iban_action": "new" }
}
```

---

## S5_FINANCIAL_SUMMARY

**updated_claim shape:**
```json
{
  "financial_summary": {
    "claim_amount": 1500,
    "vat": 0,
    "deductible": 0,
    "co_insurance_share": 0,
    "total_deductions": 0,
    "estimated_payout": 1500,
    "remaining_coverage": 5000
  },
  "iban": "SA1234...",
  "processing_type": "Standard | Manual_Review_Required"
}
```

**Frontend posts back — action `SUBMIT_CONFIRMED`:**
```json
{ "action": "SUBMIT_CONFIRMED" }
```

---

## COMPLETED

**updated_claim shape:**
```json
{
  "claim_id": "UCRN1234567890",
  "processing_type": "Standard | Manual_Review_Required",
  "submission_timestamp": "2026-04-09T10:00:00.000Z"
}
```

---

## Freetext at any stage

Send `message` only — no `action`. Response will have the same `updated_stage` and `output` answering the question. No widget is re-rendered.

---

## Error response (any stage)

n8n returns a standard envelope; `output` contains the localised error. No special type field.
Show a Retry button if `useWebhook` catches a non-2xx.
