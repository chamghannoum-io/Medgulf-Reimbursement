import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ConfirmationDialog({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const [choice, setChoice] = useState(null)

  const message = payload?.message ?? t('confirmation.message')

  if (submitted) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">{t('confirmation.confirm')}</span>
      </div>
    )
  }

  function handle(action) {
    setChoice(action)
    onSubmit(action)
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-gray-900">{t('confirmation.title')}</p>
      <p className="mb-4 text-xs text-gray-600">{message}</p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handle('submit')}
          className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {t('confirmation.confirm')}
        </button>
        <button
          type="button"
          onClick={() => handle('discard')}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t('confirmation.cancel')}
        </button>
      </div>
    </div>
  )
}
