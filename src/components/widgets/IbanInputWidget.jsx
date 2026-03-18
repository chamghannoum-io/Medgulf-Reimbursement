import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { validateIban } from '../../utils/validateIban'
import { maskIban } from '../../utils/maskIban'

const NEW_IBAN_VALUE = '__new__'

function CardIcon() {
  return (
    <svg className="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10h20" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IbanModal({ children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm animate-slide-up rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        {children}
      </div>
    </div>,
    document.body
  )
}

export default function IbanInputWidget({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const savedIbans = payload?.saved_ibans ?? []
  const ibanFailed = payload?.iban_verified === false
  const hasSaved   = payload?.has_saved_ibans === true && savedIbans.length > 0

  // Default selection: first saved IBAN, or NEW if none
  const defaultSelection = hasSaved ? savedIbans[0].iban : NEW_IBAN_VALUE

  const [selectedIban, setSelectedIban] = useState(defaultSelection)
  const [newIban, setNewIban]           = useState('')
  const [error, setError]               = useState(null)
  const [showModal, setShowModal]       = useState(!submitted)

  const isNewIban = selectedIban === NEW_IBAN_VALUE

  // ── Submitted: render nothing — IBAN is shown in the financial summary ──
  if (submitted) return null

  function handleConfirm() {
    if (isNewIban) {
      const result = validateIban(newIban)
      if (!result.valid) { setError(t(result.error)); return }
      setError(null)
      setShowModal(false)
      onSubmit({ iban: newIban.replace(/\s/g, ''), iban_action: 'new_iban' })
    } else {
      const chosen = savedIbans.find((s) => s.iban === selectedIban)
      setShowModal(false)
      onSubmit({ iban: chosen?.iban, iban_action: 'use_existing' })
    }
  }

  // Thread placeholder chip while modal is open
  const threadPlaceholder = (
    <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
        <CardIcon />
      </span>
      <span className="text-sm font-medium text-brand-700">{t('iban.modal.title')}</span>
    </div>
  )

  return (
    <>
      {threadPlaceholder}
      {showModal && (
        <IbanModal>
          {/* Header */}
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <CardIcon />
            </span>
            <h2 className="text-sm font-semibold text-gray-900">{t('iban.modal.title')}</h2>
          </div>

          {/* IBAN failed banner */}
          {ibanFailed && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {t('iban.failed')}
            </div>
          )}

          <p className="mb-3 text-sm text-gray-600">{t('iban.modal.sendingTo')}</p>

          {/* Dropdown — saved IBANs + "Enter a new IBAN" */}
          {hasSaved && (
            <select
              value={selectedIban}
              onChange={(e) => { setSelectedIban(e.target.value); setError(null) }}
              className="mb-3 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {savedIbans.map((s) => (
                <option key={s.iban} value={s.iban}>{s.bankName} — {maskIban(s.iban)}</option>
              ))}
              <option value={NEW_IBAN_VALUE}>{t('iban.modal.enterNew')}</option>
            </select>
          )}

          {/* Manual input — shown when "Enter a new IBAN" is selected or no saved IBANs */}
          {isNewIban && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('iban.input.label')}</label>
              <input
                type="text"
                value={newIban}
                onChange={(e) => { setNewIban(e.target.value.toUpperCase()); setError(null) }}
                placeholder={t('iban.input.placeholder')}
                maxLength={24}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 font-mono text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          )}

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-[.98]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('iban.modal.proceed')}
          </button>
        </IbanModal>
      )}
    </>
  )
}
