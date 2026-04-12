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
    const depName = dep?.name ?? t('claimant.self')
    const selectedLabel = t(`benefitType.options.${selected}`, { defaultValue: selected })
    const article = /^[aeiou]/i.test(selectedLabel) ? 'an' : 'a'
    return (
      <div className="flex items-end gap-2 px-4 py-1 justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-none bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm rtl:rounded-br-2xl rtl:rounded-bl-none">
          {t('benefitType.ack', { article, benefitType: selectedLabel, name: depName })}
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
