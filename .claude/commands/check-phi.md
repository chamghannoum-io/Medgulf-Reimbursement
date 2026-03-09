# Check PHI Leakage

Scan a file or component for potential Protected Health Information (PHI) leakage.

## Instructions

Scan the file or describe the target: **$ARGUMENTS**

If $ARGUMENTS is a file path, read and scan it.
If $ARGUMENTS is empty, scan the entire `src/` directory.

## What Counts as PHI in This Project

PHI includes any of these appearing outside the secured claim thread UI:
- Patient/claimant names
- Diagnosis codes (ICD-10) or diagnosis descriptions
- Service codes or procedure descriptions
- Claim amounts or financial details
- Policy numbers
- Provider names combined with patient context
- IBAN numbers (unmasked)
- Dates of service combined with any other health identifiers

## Where PHI Must NOT Appear

1. **`console.log` / `console.error` / `console.warn`** — flag any that include claim object fields
2. **Error messages shown to users** — must be generic ("Something went wrong")
3. **Browser URL / query params** — claim IDs in URLs are OK, but not diagnosis/provider
4. **Notification text** — only claim reference IDs allowed, no health details
5. **localStorage / sessionStorage** — nothing should be stored here at all
6. **HTTP request URLs** — all data in POST body only, never query params

## What to Check For

```js
// 🚨 BAD — PHI in console
console.log('Claim data:', claimData)
console.error('OCR failed for diagnosis:', diagnosis_code)

// ✅ GOOD
console.log('Stage 1 webhook failed — status:', err.status)

// 🚨 BAD — PHI in error message
throw new Error(`Invalid IBAN for patient ${claimant_name}`)

// ✅ GOOD
throw new Error('IBAN verification failed')

// 🚨 BAD — unmasked IBAN
<span>{iban}</span>

// ✅ GOOD
<span>{maskIban(iban)}</span>

// 🚨 BAD — PHI in notification
"Your claim for {diagnosis} has been approved"

// ✅ GOOD
"Your claim #UCRN1234567 has been updated"
```

## Output Format

Report findings as:
- **File:** path
- **Line:** number
- **Issue:** description of PHI risk
- **Fix:** suggested safe replacement

If no issues found, confirm: "No PHI leakage detected in [target]."
