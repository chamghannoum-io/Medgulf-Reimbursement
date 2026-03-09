# Component Map — Quick Reference

## MessageFactory Mapping
`src/components/chat/MessageFactory.jsx` must handle all these types:

```jsx
const MESSAGE_COMPONENTS = {
  assistant_text:      MessageBubble,        // props: { message, side: 'left' }
  user_text:           MessageBubble,        // props: { message, side: 'right' }
  processing_steps:    ProcessingSteps,      // props: { payload }
  extracted_form:      ExtractedDataForm,    // props: { payload, onSubmit }
  claimant_selector:   ClaimantSelectorWidget, // props: { payload, onSubmit }
  iban_input:          IbanInputWidget,      // props: { payload, onSubmit }
  document_upload:     DocumentUploadCard,   // props: { payload, onSubmit }
  warning_banner:      WarningBanner,        // props: { payload, onSubmit }
  financial_summary:   FinancialSummaryCard, // props: { payload, onSubmit }
  confirmation_dialog: ConfirmationDialog,   // props: { payload, onSubmit }
  success_card:        SubmissionSuccessCard, // props: { payload }
}
```

## File Locations

```
src/components/
├── chat/
│   ├── ChatWindow.jsx          # Root chat container, renders message list
│   ├── MessageFactory.jsx      # Maps type → component
│   ├── MessageBubble.jsx       # Left (assistant) and right (user) bubbles
│   ├── TypingIndicator.jsx     # Three-dot animation during n8n processing
│   └── InputBar.jsx            # Text + voice + file attach + send
│
├── widgets/
│   ├── ClaimantSelectorWidget.jsx
│   ├── IbanInputWidget.jsx
│   ├── ExtractedDataForm.jsx
│   ├── WarningBanner.jsx
│   ├── FinancialSummaryCard.jsx
│   └── ConfirmationDialog.jsx
│
├── upload/
│   ├── DocumentUploadCard.jsx
│   ├── FilePreview.jsx
│   └── UploadProgressBar.jsx
│
└── status/
    ├── ProcessingSteps.jsx
    └── SubmissionSuccessCard.jsx
```

## ClaimContext Shape

```js
{
  // Flow state
  claimFlowState: 'IDLE',  // see CLAUDE.md for all valid states
  resumeUrl: null,          // updated after every n8n response

  // Message thread
  messages: [],             // array of { id, type, payload, timestamp }

  // Claim data (accumulated across stages)
  claimData: {
    claimant_name: null,
    policy_number: null,
    provider_name: null,
    provider_country: null,
    service_date: null,
    claim_notes: null,
    benefit_category: null,
    diagnosis_code: null,
    service_code: null,
    claim_amount: null,
    VAT: null,
    deductible: null,
    IBAN: null,
    is_user_edited: false,
    is_doc_unclear: false,
    geo_check_status: null,
    is_service_uncovered: false,
  },

  // Post-submission
  submittedClaimId: null,
  processingType: null,
}
```

## Key Utilities to Create

```
src/utils/
├── maskIban.js          # maskIban('SA12345...') → 'SA** **** **** **** ***45'
├── encodeFiles.js       # fileListToBase64Array(fileList) → Promise<string[]>
├── formatCurrency.js    # formatCurrency(1250, 'SAR') → '1,250 SAR'
└── validateIban.js      # validateIban(str) → { valid: bool, error: string|null }
```
