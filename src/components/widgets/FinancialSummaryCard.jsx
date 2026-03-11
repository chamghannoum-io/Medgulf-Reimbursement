import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/formatCurrency'
import { maskIban } from '../../utils/maskIban'

export default function FinancialSummaryCard({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const [confirmed, setConfirmed] = useState(false)

  const currency       = payload?.currency ?? 'SAR'
  const processingType = payload?.processing_type
  const breakdown      = payload?.claim_breakdown ?? {}
  const coInsurance    = payload?.co_insurance
  const policy         = payload?.policy
  const eCard          = payload?.e_card
  const iban           = payload?.iban
  const ibanVerified   = payload?.iban_verified

  const { claim_amount, vat, deductible, co_insurance_share, total_deductions, estimated_payout } = breakdown

  if (submitted || confirmed) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">{t('financial.title')} — {formatCurrency(estimated_payout, currency)}</span>
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

      {/* Claim breakdown */}
      <div className="mb-3 space-y-2 rounded-xl bg-gray-50 p-3">
        <Row label={t('financial.claimAmount')} value={formatCurrency(claim_amount, currency)} />
        {vat != null && (
          <Row label={t('financial.VAT')} value={formatCurrency(vat, currency)} muted />
        )}
        {deductible != null && (
          <Row label={t('financial.deductible')} value={formatCurrency(deductible, currency)} muted />
        )}
        {co_insurance_share != null && (
          <Row
            label={t('financial.coInsurance')}
            value={coInsurance?.is_nil ? t('financial.coInsuranceNil') : formatCurrency(co_insurance_share, currency)}
            muted
          />
        )}
        {total_deductions != null && (
          <Row label={t('financial.totalDeductions')} value={formatCurrency(total_deductions, currency)} muted />
        )}
        <div className="border-t border-gray-200 pt-2">
          <Row label={t('financial.estimatedPayout')} value={formatCurrency(estimated_payout, currency)} bold />
        </div>
      </div>

      {/* Co-insurance note */}
      {coInsurance?.summary && (
        <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          {coInsurance.summary}
        </p>
      )}

      {/* IBAN */}
      {iban && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{t('financial.ibanLabel')}</p>
            <p className="mt-0.5 font-mono text-sm text-gray-800">{maskIban(iban)}</p>
          </div>
          {ibanVerified && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {t('financial.ibanVerified')}
            </span>
          )}
        </div>
      )}

      {/* Policy details */}
      {policy && (
        <div className="mb-3 space-y-1.5 rounded-xl bg-gray-50 p-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {t('financial.policyDetails')}
          </p>
          {policy.policy_number && <Row label={t('financial.policyNumber')} value={policy.policy_number} small />}
          {policy.insured_name  && <Row label={t('financial.insuredName')}  value={policy.insured_name}  small />}
          {policy.ins_class     && <Row label={t('financial.insClass')}     value={policy.ins_class}     small />}
          {eCard?.room_type     && <Row label={t('financial.roomType')}     value={eCard.room_type}      small />}
          {eCard?.pre_approval_limit != null && (
            <Row label={t('financial.preApprovalLimit')} value={formatCurrency(eCard.pre_approval_limit, currency)} small />
          )}
        </div>
      )}

      {processingType && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {t(`financial.processingType.${processingType}`)}
        </p>
      )}

      {/* Mandatory disclaimer */}
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

function Row({ label, value, muted, bold, small }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted || small ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={[
        small ? 'text-xs' : 'text-sm',
        bold ? 'font-bold text-gray-900' : muted || small ? 'text-gray-500' : 'font-medium text-gray-800',
      ].join(' ')}>
        {value}
      </span>
    </div>
  )
}
