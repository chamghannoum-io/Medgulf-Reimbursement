import React from 'react'
import { useTranslation } from 'react-i18next'

const ACTIONS = [
  {
    key: 'submitClaim',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function QuickActions({ onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-2.5">
      <p className="mb-2 text-xs font-medium text-gray-400">{t('chat.quickActions.label')}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ACTIONS.map(({ key, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(t(`chat.quickActions.${key}`))}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100 active:scale-95"
          >
            <span aria-hidden="true">{icon}</span>
            {t(`chat.quickActions.${key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
