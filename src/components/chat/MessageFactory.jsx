import { lazy, Suspense } from 'react'
import MessageBubble from './MessageBubble'
import ProcessingSteps from '../status/ProcessingSteps'

// Heavy widgets are lazy-loaded — not needed on initial render
const LAZY_WIDGETS = {
  extracted_form:        lazy(() => import('../widgets/ExtractedDataForm')),
  claimant_selector:     lazy(() => import('../widgets/ClaimantSelectorWidget')),
  benefit_type_selector: lazy(() => import('../widgets/BenefitTypeSelectorWidget')),
  iban_input:            lazy(() => import('../widgets/IbanInputWidget')),
  document_upload:       lazy(() => import('../upload/DocumentUploadCard')),
  warning_banner:        lazy(() => import('../widgets/WarningBanner')),
  financial_summary:     lazy(() => import('../widgets/FinancialSummaryCard')),
  confirmation_dialog:   lazy(() => import('../widgets/ConfirmationDialog')),
  success_card:          lazy(() => import('../status/SubmissionSuccessCard')),
}

export default function MessageFactory({ message, onSubmit, isLastWidget }) {
  const { type, payload, submitted } = message

  const widgetProps = {
    payload,
    onSubmit: submitted ? null : onSubmit,
    submitted: !!submitted,
    isActive: isLastWidget && !submitted,
  }

  // Eagerly-loaded critical-path components
  if (type === 'assistant_text') return <MessageBubble payload={payload} side="left" />
  if (type === 'user_text')      return <MessageBubble payload={payload} side="right" />
  if (type === 'processing_steps') return <ProcessingSteps {...widgetProps} />

  // Lazily-loaded widgets
  const LazyWidget = LAZY_WIDGETS[type]
  if (!LazyWidget) return null
  return (
    <Suspense fallback={null}>
      <LazyWidget {...widgetProps} />
    </Suspense>
  )
}
