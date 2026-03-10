import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ClaimantSelectorWidget({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const dependents = payload?.dependents ?? []
  const [selectedId, setSelectedId] = useState(
    () => dependents.find((d) => d.relation === 'self')?.id ?? null
  )

  if (submitted) {
    const chosen = dependents.find((d) => d.id === selectedId)
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">
          {t('claimant.title')}: {chosen?.name}
        </span>
      </div>
    )
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-gray-900">{t('claimant.title')}</p>
      <p className="mb-3 text-xs text-gray-500">{t('claimant.subtitle')}</p>

      <div className="space-y-2">
        {dependents.map((dep) => (
          <button
            key={dep.id}
            type="button"
            onClick={() => setSelectedId(dep.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
              selectedId === dep.id
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
              {dep.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{dep.name}</p>
              <p className="text-xs text-gray-500">{t(`claimant.relations.${dep.relation}`)}</p>
            </div>
            {selectedId === dep.id && (
              <svg className="ms-auto h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!selectedId}
        onClick={() => selectedId && onSubmit({ selected_claimant_id: selectedId })}
        className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('claimant.confirm')}
      </button>
    </div>
  )
}
