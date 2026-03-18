import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const REASON_KEYS = {
  LOW_OCR_CONFIDENCE: 'success.manualReview.reasons.LOW_OCR_CONFIDENCE',
  CLAIMANT_NAME_MISMATCH: 'success.manualReview.reasons.CLAIMANT_NAME_MISMATCH',
}

const SubmissionSuccessCard = React.memo(function SubmissionSuccessCard({ payload, onSubmit }) {
  const { t } = useTranslation()
  const claimId = payload?.claim_id ?? '—'
  const processingType = payload?.processing_type
  const isManualReview = processingType === 'Manual_Review_Required'
  const timestamp = payload?.submission_timestamp
    ? new Date(payload.submission_timestamp).toLocaleString()
    : null

  const [showReviewBanner, setShowReviewBanner] = useState(isManualReview)

  return (
    <>
      {showReviewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            {/* Header */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800">{t('success.manualReview.title')}</p>
            </div>

            <p className="mb-3 text-xs text-gray-600">{t('success.manualReview.intro')}</p>

            {/* Reasons list */}
            {payload?.manual_review_reasons?.length > 0 && (
              <ul className="mb-3 space-y-1">
                {payload.manual_review_reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {REASON_KEYS[reason] ? t(REASON_KEYS[reason]) : reason}
                  </li>
                ))}
              </ul>
            )}

            {/* Note */}
            {payload?.manual_review_note && (
              <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-700">{t('success.manualReview.note')}</p>
                <p className="mt-0.5 text-xs text-amber-600">{payload.manual_review_note}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowReviewBanner(false)}
              className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {t('success.manualReview.ok')}
            </button>
          </div>
        </div>
      )}

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
    </>
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
