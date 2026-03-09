# Mock n8n Response

Generate a realistic mock n8n response fixture for local development (no live n8n required).

## Instructions

Generate a mock fixture for stage/type: **$ARGUMENTS**

Save to `src/mock/n8n/{filename}.json`

## Available Mock Types

### `stage1-success` — OCR extracted data
```json
[{
  "type": "extracted_form",
  "message": "We've extracted your information and auto-filled your claim details. Please review and confirm.",
  "extracted_data": {
    "claimant_name": "Ahmed Al-Rashid",
    "policy_number": "MG-2024-001234",
    "provider_name": "Saudi German Hospital",
    "provider_country": "Saudi Arabia",
    "service_date": "2025-01-15",
    "diagnosis_code": "J06.9",
    "service_code": "SBS-001",
    "claim_amount": 1250.00,
    "VAT": 187.50,
    "deductible": 50.00,
    "claim_notes": "Upper respiratory tract infection treatment",
    "benefit_category": "Outpatient"
  },
  "ocr_confidence": 0.91,
  "is_doc_unclear": false,
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage2"
}]
```

### `stage1-unclear` — Document quality issue
```json
[{
  "type": "extracted_form",
  "message": "We couldn't read some details clearly. Please review and fill in the missing fields.",
  "extracted_data": {
    "claimant_name": null,
    "policy_number": "MG-2024-001234",
    "provider_name": "Saudi German Hospital",
    "provider_country": null,
    "service_date": null,
    "diagnosis_code": null,
    "service_code": null,
    "claim_amount": null,
    "VAT": null,
    "deductible": null,
    "claim_notes": "",
    "benefit_category": "Outpatient"
  },
  "ocr_confidence": 0.31,
  "is_doc_unclear": true,
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage2"
}]
```

### `stage2-geo-warning` — Geo/coverage warning
```json
[{
  "type": "warning_banner",
  "message": "We found a potential issue with your claim.",
  "geo_check_status": false,
  "is_service_uncovered": false,
  "benefit_category": "Outpatient",
  "saved_ibans": [
    { "id": "iban-1", "masked": "SA** **** **** **** ***7", "is_default": true }
  ],
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage3"
}]
```

### `stage2-iban` — Clean pass, go to IBAN
```json
[{
  "type": "iban_input",
  "message": "Great, your policy covers this claim. Please confirm your payment IBAN.",
  "geo_check_status": true,
  "is_service_uncovered": false,
  "benefit_category": "Outpatient",
  "saved_ibans": [
    { "id": "iban-1", "masked": "SA** **** **** **** ***7", "is_default": true }
  ],
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage3"
}]
```

### `stage3-success` — IBAN verified, financial summary
```json
[{
  "type": "financial_summary",
  "iban_verified": true,
  "estimated_payout": 1012.50,
  "processing_type": "Standard",
  "currency": "SAR",
  "claim_amount": 1250.00,
  "VAT": 187.50,
  "deductible": 50.00,
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage4"
}]
```

### `stage3-iban-fail` — IBAN verification failed
```json
[{
  "type": "iban_input",
  "iban_verified": false,
  "message": "We couldn't verify that IBAN. Please check the number and try again.",
  "saved_ibans": [],
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-stage3b"
}]
```

### `stage4-success` — Claim submitted
```json
[{
  "type": "success_card",
  "claim_id": "UCRN7291847",
  "submission_timestamp": "2025-01-15T14:32:00.000Z",
  "processing_type": "Standard",
  "message": "Your reimbursement request has been submitted successfully."
}]
```

### `claimant-selector` — Claimant selection needed
```json
[{
  "type": "claimant_selector",
  "message": "Who is this claim for?",
  "dependents": [
    { "id": "self", "name": "Ahmed Al-Rashid", "relation": "self" },
    { "id": "dep-1", "name": "Fatima Al-Rashid", "relation": "spouse" },
    { "id": "dep-2", "name": "Omar Al-Rashid", "relation": "child" }
  ],
  "resumeUrl": "http://localhost:5678/webhook-waiting/mock-resume-claimant"
}]
```

## Usage in Development

In `webhookService.js`, check for a dev mock flag:
```js
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
  const mock = await import(`../mock/n8n/${mockFile}.json`)
  return normalisedResponse(mock.default)
}
```

Add `VITE_USE_MOCK=true` to `.env.local` to enable mock mode.
