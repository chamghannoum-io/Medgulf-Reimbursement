import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/formatCurrency'

export default function FinancialSummaryCard({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const [confirmed, setConfirmed] = useState(false)

  const currency = payload?.currency ?? 'SAR'
  const claimAmount = payload?.claim_amount
  const vat = payload?.VAT
  const deductible = payload?.deductible
  const estimatedPayout = payload?.estimated_payout
  const processingType = payload?.processing_type

  if (submitted || confirmed) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">{t('financial.title')} — {formatCurrency(estimatedPayout, currency)}</span>
      </div>
    )
  }

  function handleSubmit() {
    setConfirmed(true)
    onSubmit('submit')
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-gray-900">{t('financial.title')}</p>

      <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-3">
        <Row label={t('financial.claimAmount')} value={formatCurrency(claimAmount, currency)} />
        <Row label={t('financial.VAT')} value={formatCurrency(vat, currency)} muted />
        <Row label={t('financial.deductible')} value={formatCurrency(deductible, currency)} muted />
        <div className="border-t border-gray-200 pt-2">
          <Row
            label={t('financial.estimatedPayout')}
            value={formatCurrency(estimatedPayout, currency)}
            bold
          />
        </div>
      </div>

      {processingType && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {t(`financial.processingType.${processingType}`)}
        </p>
      )}

      {/* Mandatory disclaimer — must never be hidden */}
      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {t('financial.disclaimer')}
      </p>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {t('financial.submit')}
      </button>
    </div>
  )
}

function Row({ label, value, muted, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold text-gray-900' : muted ? 'text-gray-400' : 'font-medium text-gray-800'}`}
      >
        {value}
      </span>
    </div>
  )
}
