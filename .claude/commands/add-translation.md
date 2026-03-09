# Add Translation Key

Add a new i18n key to both locale files simultaneously.

## Instructions

The translation to add is: **$ARGUMENTS**

Parse $ARGUMENTS as: `key.path "English text" "Arabic text"`

Example: `chat.input.placeholder "Describe your medical event…" "صف حدثك الطبي…"`

## Steps

1. Add the key to `src/locales/en.json` at the correct nested path
2. Add the key to `src/locales/ar.json` at the same nested path with the Arabic value
3. Confirm the key follows the naming convention: `screen.component.element`

## Key Naming Convention

```
chat.input.placeholder
chat.input.send
chat.input.voiceStart
chat.input.voiceStop
chat.header.languageToggle
chat.header.saveDraft
widget.claimantSelector.title
widget.claimantSelector.confirm
widget.ibanInput.title
widget.ibanInput.placeholder
widget.ibanInput.useExisting
widget.ibanInput.useDifferent
widget.ibanInput.verified
widget.documentUpload.title
widget.documentUpload.browseButton
widget.documentUpload.requirements
widget.extractedForm.title
widget.extractedForm.confirm
widget.extractedForm.lowConfidence
widget.financialSummary.title
widget.financialSummary.disclaimer
widget.financialSummary.submit
widget.warningBanner.geoWarning
widget.warningBanner.coverageWarning
widget.warningBanner.submitAnyway
widget.warningBanner.discard
processing.step1
processing.step2
processing.step3
processing.step4
processing.step5
processing.step6
errors.networkError
errors.timeout
errors.retry
success.claimSubmitted
success.notificationExpectation
```

## Important
- Arabic text must be RTL-compatible — test by checking in the UI
- Do NOT use Eastern Arabic numerals (٠١٢٣) — use Western (0123)
- Currency format: always `{amount} {code}` not symbols
