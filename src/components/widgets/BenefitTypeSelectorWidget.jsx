import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function BenefitTypeSelectorWidget({ payload, onSubmit, submitted, isActive }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const benefitTypes = payload?.benefit_types || []
  const dependents = payload?.dependents || []
  const [selectedDependent, setSelectedDependent] = useState(
    () => dependents.find(d => d.relation === 'self')?.id ?? dependents[0]?.id ?? null
  )
  const hasDependents = dependents.length > 0
  const canConfirm = selected && (!hasDependents || selectedDependent)

  if (submitted) {
    const dep = hasDependents ? dependents.find(d => d.id === selectedDependent) : null
    const depName = dep?.name ?? null
    const selectedLabel = t(`benefitType.options.${selected}`, { defaultValue: selected })
    return (
      <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <p className="text-sm font-semibold text-gray-900">{t('benefitType.title')}</p>
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {t('benefitType.confirmed')}
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium text-gray-500">{t('benefitType.selected')}</span>
            <span className="text-xs font-semibold text-gray-800">{selectedLabel}</span>
          </div>
          {depName && (
            <div className="flex items-center justify-between px-4 py-2.5 pb-4">
              <span className="text-xs font-medium text-gray-500">{t('benefitType.forWhom.forLabel')}</span>
              <span className="text-xs font-semibold text-gray-800">{depName}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  function handleConfirm() {
    if (!canConfirm || !onSubmit) return
    const dep = hasDependents ? dependents.find(d => d.id === selectedDependent) : null
    onSubmit({
      benefit_type: selected,
      for_dependent_id: dep?.id ?? 'SELF',
      for_dependent_name: dep?.name ?? null,
      _submittedValue: selected,
    })
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Dependent selector — shown only when dependents exist */}
      {hasDependents && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-semibold text-gray-900">{t('benefitType.forWhom.label')}</p>
          <p className="mb-2 text-xs text-gray-500">{t('benefitType.forWhom.subtitle')}</p>
          <select
            value={selectedDependent ?? ''}
            onChange={e => setSelectedDependent(e.target.value || null)}
            className={[
              'w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400',
              selectedDependent ? 'border-brand-400 text-gray-900' : 'border-gray-300 text-gray-400',
            ].join(' ')}
          >
            <option value="">{t('benefitType.forWhom.placeholder')}</option>
            {dependents.map(dep => (
              <option key={dep.id} value={dep.id}>
                {dep.name} — {t(`claimant.relations.${dep.relation}`, { defaultValue: dep.relation })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Benefit type grid */}
      <p className="mb-1 text-sm font-semibold text-gray-900">{t('benefitType.title')}</p>
      <p className="mb-3 text-xs text-gray-500">{t('benefitType.subtitle')}</p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {benefitTypes.map((bt) => {
          const label = t(`benefitType.options.${bt.value}`, { defaultValue: bt.label })
          const isSelected = selected === bt.value
          return (
            <button
              key={bt.value}
              type="button"
              onClick={() => setSelected(bt.value)}
              className={[
                'flex items-center justify-center rounded-xl border px-2 py-4 text-center text-xs font-medium leading-tight transition-colors',
                isSelected
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('benefitType.confirm')}
      </button>
    </div>
  )
}
