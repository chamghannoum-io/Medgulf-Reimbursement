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

  const rawNote = payload?.manual_review_note
  const manualReviewNote = !rawNote
    ? null
    : typeof rawNote === 'string'
      ? rawNote
      : rawNote.summary ?? rawNote.title ?? null

  // Prefer detailed human-readable reasons from the note object; fall back to coded keys
  const detailedReasons = typeof rawNote === 'object' && rawNote?.reasons?.length > 0
    ? rawNote.reasons
    : null

  const [showReviewBanner, setShowReviewBanner] = useState(isManualReview)

  return (
    <>
      {/* Manual review modal */}
      {showReviewBanner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center px-4">
          <div className="w-full max-w-sm animate-slide-up rounded-t-3xl sm:rounded-3xl bg-white px-5 pb-8 pt-5 shadow-2xl">
            {/* Drag indicator */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

            {/* Header */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{t('success.manualReview.title')}</p>
            </div>

            <p className="mb-3 text-xs text-gray-500">{t('success.manualReview.intro')}</p>

            {/* Reasons list */}
            {(detailedReasons ?? payload?.manual_review_reasons)?.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {(detailedReasons ?? payload.manual_review_reasons).map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {detailedReasons ? reason : (REASON_KEYS[reason] ? t(REASON_KEYS[reason]) : reason)}
                  </li>
                ))}
              </ul>
            )}

            {/* Note */}
            {manualReviewNote && (
              <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-medium text-amber-700">{t('success.manualReview.note')}</p>
                <p className="mt-0.5 text-xs text-amber-600">{manualReviewNote}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowReviewBanner(false)}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {t('success.manualReview.ok')}
            </button>
          </div>
        </div>
      )}

      {/* Success card */}
      <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">{t('success.title')}</p>
        </div>

        <p className="mb-3 text-xs text-gray-500">{t('success.message')}</p>

        {/* Claim details */}
        <div className="mb-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
          <Detail label={t('success.claimId')} value={claimId} mono />
          {processingType && (
            <Detail label={t('success.processingType')} value={processingType} />
          )}
          {timestamp && <Detail label={t('success.timestamp')} value={timestamp} />}
        </div>

        {/* Notification hint */}
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-600">{t('success.notification')}</p>
        </div>

        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
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
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-right text-xs font-semibold text-gray-800 ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</span>
    </div>
  )
}
