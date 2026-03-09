# Medgulf Smart Assistant — Claude Code Context

## What This Project Is
A bilingual (Arabic/English) React (Vite) conversational UI for submitting cash-based medical reimbursement claims. Users interact via a ChatGPT-style chat interface enriched with inline wizard widgets. The full SRS is in `.claude/docs/SRS_summary.md`.

## The Golden Rule
**The frontend is thin.** It never calls insurance APIs, OCR APIs, or bank APIs directly.
- n8n owns all business logic: OCR, eligibility checks, IBAN verification, benefits mapping, geo-validation, CPT→SBS coding, claim submission to MG Core.
- The frontend does three things: **capture input → POST to n8n webhook → render what n8n sends back.**

---

## Architecture at a Glance

```
User Input (text / voice / file)
        ↓
   ChatWindow (React)
        ↓
  webhookService.js  ──POST──→  n8n Webhook
                     ←JSON──   { type, message, data, resumeUrl }
        ↓
  MessageFactory → renders correct widget/bubble
        ↓
  User acts on widget
        ↓
  webhookService.js  ──POST──→  resumeUrl  (n8n Wait node resumes)
        ↓
        ... repeat per stage ...
```

### The resumeUrl Pattern (Mednet-inherited)
Every n8n response includes a `resumeUrl`. After the user acts on a widget, POST to that URL to advance the n8n execution to the next stage. Store `resumeUrl` in `ClaimContext` after each response.

---

## Environment Variables
```
VITE_WEBHOOK_BASE_URL=   # n8n base URL (e.g. https://n8n.yourdomain.com)
VITE_INITIAL_WEBHOOK_PATH=  # path segment for the first webhook (e.g. /webhook/uuid)
```
Never hardcode URLs. Always use `import.meta.env.VITE_*`.

---

## Project Structure
```
src/
├── components/
│   ├── chat/           # ChatWindow, MessageBubble, TypingIndicator, InputBar
│   ├── widgets/        # All inline interactive elements (see Widget Rules)
│   ├── upload/         # DocumentUploadCard, FilePreview, ProgressBar
│   └── status/         # ProcessingSteps, WarningBanner, SuccessCard
├── context/
│   ├── SessionContext.jsx   # User/policy identity — loaded from mock or token
│   └── ClaimContext.jsx     # Claim flow state machine + resumeUrl storage
├── hooks/
│   ├── useWebhook.js        # Wraps fetch calls to n8n, handles loading/error
│   ├── useVoiceInput.js     # Web Speech API wrapper with AR/EN language switching
│   └── useClaimFlow.js      # State machine transitions
├── services/
│   └── webhookService.js    # ALL n8n POST calls — centralised, no fetch() in components
├── locales/
│   ├── en.json
│   └── ar.json
├── mock/
│   ├── session.json         # Dev fixture for SessionContext
│   └── n8n/                 # Mock response fixtures per stage
└── pages/
    └── ClaimPage.jsx        # Root — renders ChatWindow inside ClaimContext
```

---

## Claim Flow State Machine
The `ClaimContext` maintains `claimFlowState`. Valid transitions only — never jump states.

```
IDLE → GREETING → CLAIMANT_PENDING → CLAIMANT_VERIFIED → UPLOAD_PENDING
→ ANALYZING_DOCS → DATA_EXTRACTED → AWAITING_CONFIRMATION → POLICY_CHECKING
→ POLICY_CHECKED → IBAN_PENDING → IBAN_VERIFIED → AWAITING_SUBMISSION
→ SUBMITTING → SUBMITTED
```

Special: `DRAFT_SAVED` can be entered from any state except `SUBMITTED`.

---

## Message Types → Components
The `MessageFactory` maps `response.type` to the correct component. **This mapping is the core rendering contract — do not break it.**

| `type` value | Component |
|---|---|
| `assistant_text` | `MessageBubble` (left-aligned) |
| `user_text` | `MessageBubble` (right-aligned) |
| `processing_steps` | `ProcessingSteps` |
| `extracted_form` | `ExtractedDataForm` |
| `claimant_selector` | `ClaimantSelectorWidget` |
| `iban_input` | `IbanInputWidget` |
| `document_upload` | `DocumentUploadCard` |
| `warning_banner` | `WarningBanner` |
| `financial_summary` | `FinancialSummaryCard` |
| `confirmation_dialog` | `ConfirmationDialog` |
| `success_card` | `SubmissionSuccessCard` |

---

## Widget Rules
Every widget in `src/components/widgets/` must follow these rules:

1. **Receives `payload` and `onSubmit(data)` props** — never calls webhookService directly
2. **Becomes read-only after `onSubmit` is called** — show confirmed value with checkmark
3. **Never modifies ClaimContext directly** — communicates up via `onSubmit`
4. **Has both EN and AR label variants** — all strings from `useTranslation()`
5. **Validates client-side before calling `onSubmit`** — never send invalid data to n8n

---

## Webhook Service Contract
All n8n calls go through `src/services/webhookService.js`. Functions:

```js
postInitialUpload(sessionCtx, files, claimNotes)   // Stage 1
postFormConfirmation(resumeUrl, formData)           // Stage 2
postIbanConfirmation(resumeUrl, ibanData)           // Stage 3
postFinalSubmission(resumeUrl, submitAction)        // Stage 4
postSaveDraft(resumeUrl, draftState)               // Any stage
```

Every function must:
- Include `Authorization: Bearer ${session_token}` header
- Return `{ data, resumeUrl }` — always extract and return the resumeUrl
- Throw a typed error on non-2xx — caught by `useWebhook` hook

---

## i18n Rules
- **Zero hardcoded strings in components.** Every user-visible string lives in `en.json` and `ar.json`.
- Use `const { t } = useTranslation()` in every component.
- Key naming: `screen.component.element` e.g. `chat.input.placeholder`
- Arabic numerals: use Western Arabic numerals (0-9) — do not convert to Eastern Arabic (٠-٩)
- Dates: `DD/MM/YYYY` in both locales
- Currency: always `{amount} {currencyCode}` e.g. `1,250 SAR`

---

## RTL Rules
- `<html dir="rtl" lang="ar">` when Arabic is active — toggle in i18n initialisation
- Use Tailwind `rtl:` variants for mirrored layouts — never hardcode `left`/`right` in inline styles
- Chat bubbles: user bubble `rtl:ml-0 rtl:mr-auto` in AR, `ml-auto` in EN
- The language toggle button is always visible in the chat header — never hidden
- Fonts: `font-arabic` (Noto Sans Arabic) in AR, `font-sans` (Inter) in EN — configure in `tailwind.config.js`

---

## Security Rules — Non-Negotiable
- **No PHI in console.log, error messages, or notification previews.** Strip diagnosis/service from any text shown outside the secure claim thread.
- **Files are base64 encoded in memory only.** Never write to localStorage, sessionStorage, or IndexedDB.
- **IBAN must be masked on display.** Use `maskIban(iban)` utility: show first 2 chars + last 3 chars, rest as `*`. e.g. `SA** **** **** **** ***7`
- **session_token goes in Authorization header only** — never in URL params, never logged.
- `is_user_edited` flag must be set to `true` in the payload any time the user modifies an OCR-extracted field.

---

## Session Context (Auth TBD)
Auth is not finalised. Build `SessionContext` to accept this shape — swappable between mock and real:

```js
{
  user_id: String,
  policy_number: String,
  is_primary: Boolean,      // true = primary insured
  full_name: String,
  language: "ar" | "en",
  session_token: String
}
```

For local dev, load from `src/mock/session.json`. The context must be swappable without changing any component.

---

## Processing Steps (OCR Animation)
During `ANALYZING_DOCS` state, `ProcessingSteps` renders these 6 steps in order:

| # | EN | AR |
|---|---|---|
| 1 | Extracting provider name… | جارٍ استخراج اسم مقدم الخدمة… |
| 2 | Detecting date of service… | جارٍ تحديد تاريخ الخدمة… |
| 3 | Identifying benefit category… | جارٍ تحديد فئة المزايا… |
| 4 | Calculating claimed amount… | جارٍ احتساب المبلغ المطالب به… |
| 5 | Checking document clarity… | جارٍ التحقق من وضوح المستند… |
| 6 | Validating policy eligibility… | جارٍ التحقق من أهلية الوثيقة… |

Steps animate: pending (grey dot) → active (spinning teal) → complete (teal checkmark).
If n8n doesn't stream progress events, animate at 1.2s intervals as fallback.

---

## Error Handling Pattern
```js
// In useWebhook:
try {
  const response = await webhookService.postX(...)
  dispatch({ type: 'WEBHOOK_SUCCESS', payload: response })
} catch (err) {
  dispatch({ type: 'WEBHOOK_ERROR' })
  // Adds assistant_text message: "Something went wrong. Please try again."
  // With a Retry button that replays the last POST
}
```
Timeout: 30 seconds. After timeout, show retry message and re-enable input bar.

---

## What Is Out of Scope (Phase 2)
- Claim History screen (US-006)
- Claim Resubmission flow (US-007)
- Push notification service (handled by MG Backend)
- Any direct calls to MG Core APIs

---

## Key Files to Read First
When starting any task, check:
1. This file (you're reading it)
2. `.claude/docs/SRS_summary.md` — for detailed requirements on any specific screen/widget
3. `.claude/docs/webhook-payloads.md` — for exact JSON shapes before writing any webhook call
4. `src/context/ClaimContext.jsx` — before touching any state logic
5. `src/services/webhookService.js` — before adding any n8n integration
