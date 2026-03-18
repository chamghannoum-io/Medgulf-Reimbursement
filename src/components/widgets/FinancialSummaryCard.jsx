import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/formatCurrency'
import { maskIban } from '../../utils/maskIban'

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className = 'h-3 w-3' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function WarnIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

function InfoIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function SectionHeader({ title, noMargin }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-widest text-gray-400 ${noMargin ? '' : 'mb-2.5'}`}>
      {title}
    </p>
  )
}

function DataRow({ label, value, bold, muted }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={`shrink-0 text-xs ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-right text-xs ${bold ? 'font-semibold text-gray-800' : muted ? 'italic text-gray-400' : 'font-medium text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

function PayoutRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-teal-700">{label}</span>
      <span className="font-mono text-base font-bold tracking-tight text-teal-600">{value}</span>
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const COVERAGE_STYLES = {
  Fully_Covered: 'bg-green-100 text-green-700',
  Partial:       'bg-amber-100 text-amber-700',
  Not_Covered:   'bg-red-100 text-red-700',
}

function CoverageStatusBadge({ status, t }) {
  const cls = COVERAGE_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status === 'Fully_Covered' && <CheckIcon />}
      {t(`financial.coverageStatus.${status}`, { defaultValue: status.replace(/_/g, ' ') })}
    </span>
  )
}

// ─── Document row ─────────────────────────────────────────────────────────────

const CLARITY_STYLES = {
  Clear:        'bg-green-100 text-green-700',
  Low_Clarity:  'bg-amber-100 text-amber-700',
}

function DocRow({ doc, t }) {
  const clarityKey = doc.clarity?.replace(/\s+/g, '_')
  const cls = CLARITY_STYLES[clarityKey] ?? 'bg-gray-100 text-gray-500'
  const label = doc.clarity
    ? t(`financial.clarity.${clarityKey}`, { defaultValue: doc.clarity })
    : null

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
          <DocIcon />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-800">{doc.label}</p>
          {doc.filename && (
            <p className="truncate text-[10px] text-gray-400">{doc.filename}</p>
          )}
        </div>
      </div>
      {label && (
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>
          {label}
        </span>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinancialSummaryCard({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const [confirmed, setConfirmed] = useState(false)

  const currency        = payload?.currency ?? 'SAR'
  const processingType  = payload?.processing_type
  const isManualReview  = processingType === 'Manual_Review_Required'

  // Support both nested claim_breakdown and flat top-level fields
  const bd               = payload?.claim_breakdown ?? {}
  const claim_amount     = bd.claim_amount     ?? payload?.claim_amount
  const vat              = bd.vat              ?? payload?.VAT
  const deductible       = bd.deductible       ?? payload?.deductible
  const co_insurance_share = bd.co_insurance_share ?? payload?.co_insurance_share
  const total_deductions = bd.total_deductions ?? payload?.total_deductions
  const estimated_payout = bd.estimated_payout ?? payload?.estimated_payout

  const originalClaim   = payload?.original_claim ?? null
  const coInsurance     = payload?.co_insurance
  const policy          = payload?.policy
  const eCard           = payload?.e_card
  const iban            = payload?.iban
  const ibanVerified    = payload?.iban_verified
  const claimDetails    = payload?.claim_details
  const coverageStatus  = payload?.coverage_status
  const submittedDocs   = payload?.submitted_documents ?? []
  const preApprovalWarn = payload?.pre_approval_warning
  const manualReviewNote = payload?.manual_review_note

  // Co-insurance display value
  function coInsuranceValue() {
    if (coInsurance) {
      if (coInsurance.is_nil) {
        const desc = coInsurance.nil_description ?? coInsurance.summary ?? ''
        return desc ? `NIL — ${desc}` : t('financial.coInsuranceNil')
      }
      return coInsurance.summary ?? (co_insurance_share != null ? formatCurrency(co_insurance_share, currency) : null)
    }
    return co_insurance_share != null ? formatCurrency(co_insurance_share, currency) : null
  }

  const coInsVal = coInsuranceValue()

  if (submitted || confirmed) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">
          {t('financial.title')} — {formatCurrency(estimated_payout, currency)}
        </span>
      </div>
    )
  }

  function handleSubmit() {
    setConfirmed(true)
    onSubmit('submit')
  }

  return (
    <div className="mx-4 my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ── Pre-approval warning ── */}
      {preApprovalWarn && (
        <div className="flex gap-3 border-b border-red-100 bg-red-50 px-4 py-3">
          <WarnIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-red-700">{preApprovalWarn.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-red-600">{preApprovalWarn.message}</p>
          </div>
        </div>
      )}

      {/* ── Claim Details ── */}
      {claimDetails && (
        <div className="border-b border-gray-100 px-4 py-3">
          <SectionHeader title={t('financial.claimDetails')} />
          <div className="space-y-2.5">
            {claimDetails.date_of_treatment && (
              <DataRow label={t('financial.dateOfTreatment')} value={claimDetails.date_of_treatment} />
            )}
            {claimDetails.provider_name && (
              <DataRow label={t('financial.provider')} value={claimDetails.provider_name} bold />
            )}
            {claimDetails.benefit_category && (
              <DataRow label={t('financial.benefitCategory')} value={claimDetails.benefit_category} />
            )}
          </div>
        </div>
      )}

      {/* ── Financial Summary ── */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <SectionHeader title={t('financial.title')} noMargin />
          {coverageStatus && <CoverageStatusBadge status={coverageStatus} t={t} />}
        </div>
        <div className="space-y-2.5">
          {claim_amount != null && (
            <DataRow label={t('financial.claimAmount')} value={formatCurrency(claim_amount, currency)} />
          )}
          {originalClaim && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
                {t('financial.currencyConversion')}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-blue-600">{t('financial.originalAmount')}</span>
                <span className="font-mono text-xs font-semibold text-blue-700">
                  {originalClaim.amount.toLocaleString()} {originalClaim.currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-blue-600">{t('financial.convertedAmount')}</span>
                <span className="font-mono text-xs font-semibold text-blue-700">
                  {formatCurrency(originalClaim.converted_amount, originalClaim.converted_currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-blue-500">{t('financial.exchangeRate')}</span>
                <span className="font-mono text-xs text-blue-600">
                  1 {originalClaim.currency} = {originalClaim.rate} {originalClaim.converted_currency}
                </span>
              </div>
              {originalClaim.date && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-blue-400">{t('financial.rateDate')}</span>
                  <span className="text-xs text-blue-500">{originalClaim.date}</span>
                </div>
              )}
            </div>
          )}
          {deductible != null && (
            <DataRow label={t('financial.deductible')} value={formatCurrency(deductible, currency)} muted />
          )}
          {coInsVal != null && (
            <DataRow label={t('financial.coInsurance')} value={coInsVal} muted />
          )}
          {vat != null && (
            <DataRow
              label={t('financial.VAT')}
              value={vat === 0 ? t('financial.vatNotReimbursed') : formatCurrency(vat, currency)}
              muted
            />
          )}
          {total_deductions != null && (
            <DataRow label={t('financial.totalDeductions')} value={formatCurrency(total_deductions, currency)} muted />
          )}
          {estimated_payout != null && (
            <div className="border-t border-gray-100 pt-2.5">
              <PayoutRow label={t('financial.estimatedPayout')} value={formatCurrency(estimated_payout, currency)} />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <p className="text-xs leading-relaxed text-gray-500">{t('financial.disclaimer')}</p>
        </div>
      </div>

      {/* ── Submitted Documents ── */}
      {submittedDocs.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-3">
          <SectionHeader title={t('financial.documents')} />
          <div className="space-y-3">
            {submittedDocs.map((doc, i) => (
              <DocRow key={i} doc={doc} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Payment Account (IBAN) ── */}
      {iban && (
        <div className="border-b border-gray-100 px-4 py-3">
          <SectionHeader title={t('financial.ibanLabel')} />
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold tracking-wide text-gray-800">
              {maskIban(iban)}
            </p>
            <div className="flex flex-shrink-0 items-center gap-2">
              {ibanVerified && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  <CheckIcon />
                  {t('financial.ibanVerified')}
                </span>
              )}
              <button
                type="button"
                onClick={() => onSubmit('change_iban')}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                {t('financial.ibanChange')}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">{t('financial.ibanNote')}</p>
        </div>
      )}

      {/* ── Policy Details ── */}
      {policy && (
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <SectionHeader title={t('financial.policyDetails')} noMargin />
            {isManualReview && (
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <WarnIcon className="h-3 w-3" />
                {t('financial.manualReviewBadge')}
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {policy.policy_number && (
              <DataRow label={t('financial.policyNumber')} value={policy.policy_number} />
            )}
            {policy.insured_name && (
              <DataRow label={t('financial.insuredName')} value={policy.insured_name} bold />
            )}
            {(policy.plan ?? policy.ins_class) && (
              <DataRow label={t('financial.plan')} value={policy.plan ?? policy.ins_class} />
            )}
            {policy.annual_limit != null && (
              <DataRow
                label={t('financial.annualLimit')}
                value={`${formatCurrency(policy.annual_limit, currency)}${policy.limit_used != null ? ` — ${policy.limit_used} ${t('financial.limitUsed')}` : ''}`}
              />
            )}
            {policy.valid_until && (
              <DataRow label={t('financial.validUntil')} value={policy.valid_until} />
            )}
            {eCard?.room_type && (
              <DataRow label={t('financial.roomType')} value={eCard.room_type} />
            )}
            {eCard?.pre_approval_limit != null && (
              <DataRow label={t('financial.preApprovalLimit')} value={formatCurrency(eCard.pre_approval_limit, currency)} />
            )}
          </div>
          {isManualReview && manualReviewNote && (
            <div className="mt-3 flex gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-blue-700">{t('financial.manualReviewWhy')}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-600">{manualReviewNote}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Submit ── */}
      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {t('financial.submit')}
        </button>
      </div>
    </div>
  )
}
