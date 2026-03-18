import { lazy, Suspense, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
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

const BANNER_STYLES = {
  error:   { overlay: 'bg-red-50 border-red-200',   icon: 'text-red-500',   iconBg: 'bg-red-100',  title: 'text-red-800',   body: 'text-red-700',   btn: 'bg-red-500 hover:bg-red-600'     },
  warning: { overlay: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', iconBg: 'bg-amber-100', title: 'text-amber-800', body: 'text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600' },
}

function BannerPopup({ banner, onDismiss }) {
  const { t } = useTranslation()
  const s = BANNER_STYLES[banner.type] ?? BANNER_STYLES.warning
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onDismiss}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${s.overlay}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${s.iconBg}`}>
            <svg className={`h-7 w-7 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className={`text-base font-semibold ${s.title}`}>{banner.title}</p>
            <p className={`mt-1.5 text-sm leading-relaxed ${s.body}`}>{banner.message}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${s.btn}`}
          >
            {t('common.okGotIt')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Gate: shows popup first, renders widget only after dismissal.
// If already submitted (chat history), skip popup entirely.
function WidgetWithBannerGate({ banner, LazyWidget, widgetProps }) {
  const [dismissed, setDismissed] = useState(() => !banner || widgetProps.submitted)

  return (
    <>
      {banner && !dismissed && (
        <BannerPopup banner={banner} onDismiss={() => setDismissed(true)} />
      )}
      {dismissed && (
        <Suspense fallback={null}>
          <LazyWidget {...widgetProps} />
        </Suspense>
      )}
    </>
  )
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

  const banner = payload?.warning_banner ?? null

  // If payload has an embedded warning_banner, gate the widget behind the popup
  if (banner) {
    return <WidgetWithBannerGate banner={banner} LazyWidget={LazyWidget} widgetProps={widgetProps} />
  }

  return (
    <Suspense fallback={null}>
      <LazyWidget {...widgetProps} />
    </Suspense>
  )
}
