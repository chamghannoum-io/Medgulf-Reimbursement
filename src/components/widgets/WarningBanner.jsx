import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const WarningBanner = React.memo(function WarningBanner({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const [choice, setChoice] = useState(null)

  const warnings = []
  if (payload?.geo_check_status === false) warnings.push('geo')
  if (payload?.is_service_uncovered) warnings.push('coverage')
  if (payload?.is_doc_unclear) warnings.push('docUnclear')

  if (submitted) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-gray-600">
          {choice === 'discard' ? t('warning.discard') : t('warning.submitAnyway')}
        </span>
      </div>
    )
  }

  function handle(action) {
    setChoice(action)
    onSubmit(action === 'discard' ? 'discard' : 'submit_with_flag')
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      {/* Warning icon + title */}
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm font-semibold text-amber-800">
          {warnings.map((w) => t(`warning.${w}.title`)).join(' · ')}
        </p>
      </div>

      {/* Warning messages */}
      <div className="mb-3 space-y-2">
        {warnings.map((w) => (
          <p key={w} className="text-xs text-amber-700">
            {t(`warning.${w}.message`)}
          </p>
        ))}
        <p className="text-xs font-medium text-amber-800">{t('warning.note')}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handle('submit_with_flag')}
          className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          {t('warning.submitAnyway')}
        </button>
        <button
          type="button"
          onClick={() => handle('discard')}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t('warning.discard')}
        </button>
      </div>
    </div>
  )
})

export default WarningBanner
