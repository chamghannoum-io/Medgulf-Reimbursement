import React from 'react'
import { useTranslation } from 'react-i18next'

const SubmissionSuccessCard = React.memo(function SubmissionSuccessCard({ payload, onSubmit }) {
  const { t } = useTranslation()
  const claimId = payload?.claim_id ?? '—'
  const processingType = payload?.processing_type
  const timestamp = payload?.submission_timestamp
    ? new Date(payload.submission_timestamp).toLocaleString()
    : null

  return (
    <div className="mx-4 my-2 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
      {/* Success icon */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold text-green-800">{t('success.title')}</p>
      </div>

      <p className="mb-4 text-sm text-green-700">{t('success.message')}</p>

      {/* Claim details */}
      <div className="mb-4 space-y-2 rounded-xl bg-white p-3">
        <Detail label={t('success.claimId')} value={claimId} mono />
        {processingType && (
          <Detail label={t('success.processingType')} value={processingType} />
        )}
        {timestamp && <Detail label={t('success.timestamp')} value={timestamp} />}
      </div>

      <p className="text-xs text-green-600">{t('success.notification')}</p>

      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          {t('success.newClaim')}
        </button>
      )}
    </div>
  )
})

export default SubmissionSuccessCard

function Detail({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
