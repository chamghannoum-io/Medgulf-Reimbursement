import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const REQUIRED_FIELDS = [
  'claimant_name',
  'provider_name',
  'provider_country',
  'service_date',
  'claim_amount',
]

const READ_ONLY_FIELDS = ['policy_number', 'benefit_category']
const NUMERIC_FIELDS   = ['claim_amount', 'VAT', 'deductible']

const FIELD_KEYS = [
  'claimant_name',
  'policy_number',
  'provider_name',
  'provider_country',
  'service_date',
  'diagnosis_code',
  'service_code',
  'claim_amount',
  'VAT',
  'deductible',
  'claim_notes',
  'benefit_category',
]

const FIELD_I18N = {
  claimant_name:    'form.fields.claimantName',
  policy_number:    'form.fields.policyNumber',
  provider_name:    'form.fields.providerName',
  provider_country: 'form.fields.providerCountry',
  service_date:     'form.fields.serviceDate',
  diagnosis_code:   'form.fields.diagnosisCode',
  service_code:     'form.fields.serviceCode',
  claim_amount:     'form.fields.claimAmount',
  VAT:              'form.fields.VAT',
  deductible:       'form.fields.deductible',
  claim_notes:      'form.fields.claimNotes',
  benefit_category: 'form.fields.benefitCategory',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeDateForDisplay(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const MONTHS = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                   jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }
  const mon = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})$/)
  if (mon) {
    const m = MONTHS[mon[2].toLowerCase()]
    if (m) return `${String(mon[1]).padStart(2, '0')}/${m}/${mon[3]}`
  }
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) return `${dmy[1]}/${dmy[2]}/${dmy[3]}`
  return s
}

/**
 * Parse a single diagnosis string into { code, description, classification }.
 * Handles: "F90.0, Description (Primary)" or "F90.0" or "F90.0 Description"
 */
function parseDiagnosisEntry(str) {
  if (!str) return null
  const s = String(str).trim()
  // "F90.0, Description (Primary|Secondary)"
  const full = s.match(/^([A-Z]\d+\.?\d*)\s*,?\s*(.*?)\s*\((Primary|Secondary)\)\s*$/i)
  if (full) {
    return {
      code: full[1].trim(),
      description: full[2].trim(),
      classification: full[3].charAt(0).toUpperCase() + full[3].slice(1).toLowerCase(),
      raw: s,
    }
  }
  // "F90.0, Description" (no classification marker) — treat as Secondary unless it's the only one
  const noClass = s.match(/^([A-Z]\d+\.?\d*)\s*,?\s*(.+)$/)
  if (noClass) {
    return { code: noClass[1].trim(), description: noClass[2].trim(), classification: null, raw: s }
  }
  // Code only
  const codeOnly = s.match(/^([A-Z]\d+\.?\d*)$/)
  if (codeOnly) {
    return { code: codeOnly[1].trim(), description: '', classification: null, raw: s }
  }
  return { code: s, description: '', classification: null, raw: s }
}

/** Coerce raw diagnosis_code value (string or array) to an array of raw strings. */
function toCodeArray(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  // newline-separated from n8n
  return String(raw).split(/\n+/).map((s) => s.trim()).filter(Boolean)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SnippetModal({ src, label, onClose }) {
  const { t } = useTranslation()
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] max-w-lg w-full rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">{t('form.snippet.title')}</p>
            {label && <p className="text-xs text-gray-400 mt-0.5">{label}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label={t('form.snippet.close')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-gray-50">
          <img
            src={src}
            alt={label ?? t('form.snippet.title')}
            className="max-w-full max-h-full rounded-lg object-contain shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}

function ViewImageButton({ src, label }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  if (!src) return null
  const imgSrc = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 hover:border-brand-300"
      >
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {t('form.viewSnippet')}
      </button>
      {open && <SnippetModal src={imgSrc} label={label} onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * Grouped diagnosis display.
 * Primary diagnosis gets an indigo badge; secondary get blue.
 * Items without a classification are treated as secondary.
 */
function DiagnosisCodeField({ codes, onChange }) {
  const { t } = useTranslation()
  const parsed = codes.map(parseDiagnosisEntry).filter(Boolean)

  const primary   = parsed.filter((d) => d.classification === 'Primary')
  const secondary = parsed.filter((d) => d.classification !== 'Primary')

  function removeCode(rawStr) {
    onChange(codes.filter((c) => c !== rawStr))
  }

  function DiagChip({ entry, variant }) {
    const base = variant === 'primary'
      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'
    const xColor = variant === 'primary' ? 'text-indigo-400 hover:text-indigo-700' : 'text-blue-400 hover:text-blue-700'
    return (
      <span className={`inline-flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${base}`}>
        <span className="font-semibold shrink-0 mt-0.5">{entry.code}</span>
        {entry.description && (
          <span className="leading-snug">{entry.description}</span>
        )}
        <button
          type="button"
          onClick={() => removeCode(entry.raw)}
          className={`ml-1 shrink-0 mt-0.5 leading-none ${xColor}`}
          aria-label={`Remove ${entry.code}`}
        >
          ×
        </button>
      </span>
    )
  }

  if (parsed.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">{t('form.fields.diagnosisEmpty')}</p>
    )
  }

  return (
    <div className="space-y-2.5">
      {primary.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
            {t('form.fields.diagnosisPrimary')}
          </p>
          <div className="flex flex-col gap-1.5">
            {primary.map((d) => <DiagChip key={d.raw} entry={d} variant="primary" />)}
          </div>
        </div>
      )}
      {secondary.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-500">
            {t('form.fields.diagnosisSecondary')}
          </p>
          <div className="flex flex-col gap-1.5">
            {secondary.map((d) => <DiagChip key={d.raw} entry={d} variant="secondary" />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ExtractedDataForm({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const extracted = payload?.extracted_data ?? {}
  const snippets = extracted.image_snippets ?? {}

  const [values, setValues] = useState(() => {
    const base = Object.fromEntries(FIELD_KEYS.map((k) => [k, extracted[k] ?? '']))
    base.service_date   = normalizeDateForDisplay(extracted.service_date)
    base.diagnosis_code = toCodeArray(extracted.diagnosis_code)
    return base
  })
  const [isUserEdited, setIsUserEdited]   = useState(false)
  const [errors, setErrors]               = useState({})
  const [confirmedValues, setConfirmedValues] = useState(null)

  // Computed once from the immutable extracted payload — avoids re-running
  // normalizeDateForDisplay / toCodeArray on every render inside the field map
  const originalValues = useMemo(() => {
    const base = Object.fromEntries(FIELD_KEYS.map((k) => [k, extracted[k] ?? '']))
    base.service_date   = normalizeDateForDisplay(extracted.service_date)
    base.diagnosis_code = toCodeArray(extracted.diagnosis_code)
    return base
  }, [extracted])

  const hasAnySnippet = FIELD_KEYS.some((k) => snippets[k])

  const validate = useCallback(() => {
    const errs = {}
    REQUIRED_FIELDS.forEach((k) => {
      const v = values[k]
      const empty = Array.isArray(v) ? v.length === 0 : !v || String(v).trim() === ''
      if (empty) {
        errs[k] = t('form.error.required')
      } else if (NUMERIC_FIELDS.includes(k) && isNaN(Number(String(v).replace(/,/g, '')))) {
        errs[k] = t('form.error.invalidNumber')
      }
    })
    return errs
  }, [values, t])

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setIsUserEdited(true)
    setErrors((prev) => prev[key] ? { ...prev, [key]: null } : prev)
  }, [])

  const handleSubmit = useCallback(() => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setConfirmedValues(values)
    onSubmit({ ...values, is_user_edited: isUserEdited })
  }, [validate, values, isUserEdited, onSubmit])

  const colClass = hasAnySnippet ? 'grid-cols-[9rem_1fr_6.5rem]' : 'grid-cols-[9rem_1fr]'

  // ── Submitted read-only view ──
  if (submitted && confirmedValues) {
    return (
      <div className="mx-4 my-2 rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-green-700">{t('form.title')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_KEYS.filter((k) => {
            const v = confirmedValues[k]
            return Array.isArray(v) ? v.length > 0 : Boolean(v)
          }).map((k) => {
            const v = confirmedValues[k]
            return (
              <div key={k} className={k === 'diagnosis_code' ? 'col-span-2' : 'col-span-1'}>
                <p className="text-xs text-green-600 mb-0.5">{t(FIELD_I18N[k])}</p>
                {Array.isArray(v) ? (
                  <div className="flex flex-wrap gap-1">
                    {v.map((raw, i) => {
                      const d = parseDiagnosisEntry(raw)
                      return (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-green-200 px-2 py-0.5 text-xs font-medium text-green-900">
                          <span className="font-semibold">{d?.code ?? raw}</span>
                          {d?.description && <span>{d.description}</span>}
                          {d?.classification && <span className="opacity-60">({d.classification})</span>}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-green-800">{v}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-gray-900">{t('form.title')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t('form.subtitle')}</p>
      </div>

      <div className={`grid border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 ${colClass}`}>
        <span>{t('form.fieldColumn')}</span>
        <span />
        {hasAnySnippet && <span className="text-center">{t('form.imageColumn')}</span>}
      </div>

      <div className="divide-y divide-gray-100">
        {FIELD_KEYS.map((key) => {
          const isReadOnly = READ_ONLY_FIELDS.includes(key)
          const isRequired = REQUIRED_FIELDS.includes(key)
          const label = t(FIELD_I18N[key])
          const val = values[key]
          const snippet = snippets[key] ?? null

          const originalVal = originalValues[key]
          const isDirty = Array.isArray(val)
            ? JSON.stringify(val) !== JSON.stringify(originalVal)
            : val !== originalVal

          return (
            <div key={key} className={`grid items-start gap-3 px-4 py-3 ${colClass}`}>

              {/* Label + badges */}
              <div className="pt-0.5 min-w-0">
                <p className="text-xs font-medium text-gray-700 leading-snug">{label}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {isReadOnly && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{t('form.readOnly')}</span>
                  )}
                  {!isReadOnly && !isRequired && (
                    <span className="text-xs text-gray-400">({t('form.optional')})</span>
                  )}
                  {isUserEdited && !isReadOnly && isDirty && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">{t('form.editedBadge')}</span>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="min-w-0">
                {key === 'diagnosis_code' ? (
                  <DiagnosisCodeField
                    codes={val}
                    onChange={(arr) => handleChange('diagnosis_code', arr)}
                  />
                ) : key === 'claim_notes' ? (
                  <textarea
                    rows={2}
                    value={val}
                    readOnly={isReadOnly}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={fieldClass(isReadOnly, !!errors[key])}
                  />
                ) : key === 'service_date' ? (
                  <input
                    type="text"
                    value={val}
                    placeholder="DD/MM/YYYY"
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={fieldClass(false, !!errors[key])}
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    readOnly={isReadOnly}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={fieldClass(isReadOnly, !!errors[key])}
                  />
                )}
                {errors[key] && <p className="mt-0.5 text-xs text-red-600">{errors[key]}</p>}
              </div>

              {/* Snippet button */}
              {hasAnySnippet && (
                <div className="flex items-start justify-center pt-1">
                  <ViewImageButton src={snippet} label={label} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {t('form.confirm')}
        </button>
      </div>
    </div>
  )
}

function fieldClass(readOnly, hasError) {
  return [
    'w-full rounded-xl border px-3 py-2 text-sm text-gray-800 outline-none transition-colors',
    readOnly
      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
      : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-400' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
