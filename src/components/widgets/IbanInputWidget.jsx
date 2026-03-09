import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { validateIban } from '../../utils/validateIban'
import { maskIban } from '../../utils/maskIban'

// ─── Credit-card icon ───────────────────────────────────────────────────────
function CardIcon() {
  return (
    <svg className="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10h20" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── The modal shell ─────────────────────────────────────────────────────────
function IbanModal({ onClose, children }) {
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full max-w-sm animate-slide-up rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-2xl sm:rounded-3xl">
        {/* Drag handle – mobile only */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        {children}
      </div>
    </div>,
    document.body
  )
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export default function IbanInputWidget({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const savedIbans  = payload?.saved_ibans ?? []
  const ibanFailed  = payload?.iban_verified === false
  const hasSaved    = savedIbans.length > 0

  // screen: 'confirm' (show saved IBAN) | 'input' (enter new IBAN)
  const [screen, setScreen]   = useState(hasSaved && !ibanFailed ? 'confirm' : 'input')
  const [showModal, setShowModal] = useState(!submitted)
  const [selectedId, setSelectedId] = useState(() => {
    const def = savedIbans.find((i) => i.is_default)
    return def?.id ?? savedIbans[0]?.id ?? null
  })
  const [newIban, setNewIban] = useState('')
  const [error, setError]     = useState(null)

  // ── Submitted read-only chip ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">
          {t('iban.verified')}:{' '}
          {screen === 'input'
            ? maskIban(newIban)
            : savedIbans.find((s) => s.id === selectedId)?.masked}
        </span>
      </div>
    )
  }

  // ── Confirm helpers ──────────────────────────────────────────────────────
  function confirmExisting() {
    const chosen = savedIbans.find((s) => s.id === selectedId)
    setShowModal(false)
    onSubmit({ iban: chosen?.masked, iban_action: 'use_existing', iban_id: selectedId })
  }

  function confirmNew() {
    const result = validateIban(newIban)
    if (!result.valid) { setError(t(result.error)); return }
    setError(null)
    setShowModal(false)
    onSubmit({ iban: newIban.replace(/\s/g, ''), iban_action: 'new_iban' })
  }

  // ── Placeholder chip in the chat thread while modal is open ─────────────
  const threadPlaceholder = (
    <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
        <CardIcon />
      </span>
      <span className="text-sm font-medium text-brand-700">{t('iban.modal.title')}</span>
    </div>
  )

  // ── Modal: confirm existing IBAN ─────────────────────────────────────────
  if (screen === 'confirm') {
    const displayIban = savedIbans.length === 1
      ? savedIbans[0].masked
      : savedIbans.find((s) => s.id === selectedId)?.masked ?? ''

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

            {/* Multi-account dropdown */}
            {savedIbans.length >= 2 && (
              <select
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mb-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {savedIbans.map((s) => (
                  <option key={s.id} value={s.id}>{s.masked}</option>
                ))}
              </select>
            )}

            <p className="mb-1 text-sm text-gray-600">{t('iban.modal.sendingTo')}</p>
            <p className="mb-3 font-mono text-sm font-semibold text-brand-600">{displayIban}</p>
            <p className="mb-5 text-sm text-gray-600">{t('iban.modal.question')}</p>

            <button
              type="button"
              onClick={confirmExisting}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 active:scale-[.98]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('iban.modal.proceed')}
            </button>

            <button
              type="button"
              onClick={() => setScreen('input')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-300 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 active:scale-[.98]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('iban.modal.update')}
            </button>
          </IbanModal>
        )}
      </>
    )
  }

  // ── Modal: enter new IBAN ────────────────────────────────────────────────
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

          <p className="mb-1 text-sm text-gray-600">{t('iban.subtitle')}</p>

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

          {/* Back to existing if any */}
          {hasSaved && (
            <button
              type="button"
              onClick={() => setScreen('confirm')}
              className="mb-3 text-xs font-medium text-brand-600 hover:underline"
            >
              {t('iban.useThis')}
            </button>
          )}

          <button
            type="button"
            onClick={confirmNew}
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-[.98]"
          >
            {t('iban.confirm')}
          </button>
        </IbanModal>
      )}
    </>
  )
}
