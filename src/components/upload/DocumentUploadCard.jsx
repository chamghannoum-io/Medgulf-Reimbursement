import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

let _idSeed = 0
function makeId() { return `f_${++_idSeed}_${Date.now()}` }

// ─── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon({ className = 'h-6 w-6 text-gray-400' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function CheckIcon({ className = 'h-5 w-5 text-green-600' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CameraIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function PlusIcon({ className = 'h-3 w-3' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

// ─── File Preview Modal ───────────────────────────────────────────────────────

function FilePreviewModal({ file, objectUrl, onClose }) {
  const isImage = file.type.startsWith('image/')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="max-w-xs truncate text-sm font-medium text-gray-800">{file.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-[200px] flex-1 items-center justify-center overflow-auto p-4">
          {isImage ? (
            <img src={objectUrl} alt={file.name} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-xl font-bold text-red-600">
                PDF
              </div>
              <p className="text-sm text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Open PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Small thumbnail chip — used in guided slots ──────────────────────────────

function FileThumbnail({ item, onPreview, onRemove }) {
  const isImage = item.file.type.startsWith('image/')
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 pr-1.5">
      <button
        type="button"
        onClick={() => onPreview(item)}
        className="flex-shrink-0 overflow-hidden rounded"
        title="Preview"
      >
        {isImage && item.objectUrl ? (
          <img src={item.objectUrl} alt="" className="h-8 w-8 object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100 text-[10px] font-bold text-red-600">
            PDF
          </div>
        )}
      </button>
      <EyeIcon className="h-3 w-3 flex-shrink-0 text-gray-300" />
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Guided slot — multiple files, no labeling needed ────────────────────────

function DocSlot({ doc, files, error, onFilesAdded, onFileRemoved, onPreview, t }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const hasFiles = files.length > 0

  return (
    <div
      className={[
        'rounded-xl border p-3',
        error && !hasFiles ? 'border-red-300 bg-red-50'
          : hasFiles ? 'border-green-200 bg-green-50'
          : 'border-dashed border-gray-300 bg-white',
      ].join(' ')}
    >
      {/* Doc info row */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {hasFiles ? <CheckIcon /> : <UploadIcon />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{doc.label}</span>
            {doc.required ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600">
                <span aria-hidden="true">*</span>
                {t('upload.slot.required')}
              </span>
            ) : (
              <span className="text-xs italic text-gray-400">
                {t('upload.slot.optional')}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-gray-500">{doc.description}</p>
          {error && !hasFiles && <p className="mt-1 text-xs text-red-600">{error}</p>}
          {hasFiles && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {files.map((item) => (
                <FileThumbnail
                  key={item.id}
                  item={item}
                  onPreview={onPreview}
                  onRemove={() => onFileRemoved(doc.key, item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload buttons — own row for easy tap targets on mobile */}
      <div className="mt-2 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          title={t('upload.quick.camera')}
          className={[
            'flex items-center justify-center rounded-lg p-2 transition-colors',
            hasFiles
              ? 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              : 'bg-brand-600 text-white hover:bg-brand-700',
          ].join(' ')}
        >
          <CameraIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={[
            'flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
            hasFiles
              ? 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              : 'bg-brand-600 text-white hover:bg-brand-700',
          ].join(' ')}
        >
          {hasFiles && <PlusIcon />}
          {hasFiles ? t('upload.slot.addMore') : t('upload.slot.tapToUpload')}
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || [])
          if (selected.length) onFilesAdded(doc.key, selected)
          e.target.value = ''
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || [])
          if (selected.length) onFilesAdded(doc.key, selected)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Quick Upload Panel — thumbnail grid + multi-tag chips ────────────────────

function QuickUploadPanel({ quickFiles, labelOptions, onFilesAdded, onFileRemoved, onToggleLabel, onPreview, t }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  return (
    <div className="flex flex-col gap-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 py-3 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
        >
          <CameraIcon className="h-4 w-4" />
          {t('upload.quick.camera')}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          <UploadIcon className="h-4 w-4 text-gray-500" />
          {t('upload.quick.browse')}
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || [])
          if (selected.length) onFilesAdded(selected)
          e.target.value = ''
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || [])
          if (selected.length) onFilesAdded(selected)
          e.target.value = ''
        }}
      />

      {quickFiles.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
          <div>
            <CameraIcon className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-1.5 text-xs text-gray-400">{t('upload.quick.empty')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {quickFiles.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-2.5">
              <div className="flex items-start gap-2.5">
                {/* Thumbnail — click to preview, no filename */}
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="flex-shrink-0 overflow-hidden rounded-lg"
                  title="Preview"
                >
                  {item.file.type.startsWith('image/') && item.objectUrl ? (
                    <img src={item.objectUrl} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                      PDF
                    </div>
                  )}
                  <div className="mt-0.5 flex justify-center">
                    <EyeIcon className="h-3 w-3 text-gray-300" />
                  </div>
                </button>

                {/* Tag chips */}
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {t('upload.quick.labelHint')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {labelOptions.map((opt) => {
                      const active = item.labels.includes(opt.key)
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => onToggleLabel(item.id, opt.key)}
                          className={[
                            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                            active
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                          ].join(' ')}
                        >
                          {active && <span className="mr-1">✓</span>}
                          {opt.label}
                        </button>
                      )
                    })}
                    {/* "Other" chip */}
                    {(() => {
                      const active = item.labels.includes('other')
                      return (
                        <button
                          type="button"
                          onClick={() => onToggleLabel(item.id, 'other')}
                          className={[
                            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                            active
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
                          ].join(' ')}
                        >
                          {active && <span className="mr-1">✓</span>}
                          {t('upload.docType.other')}
                        </button>
                      )
                    })()}
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onFileRemoved(item.id)}
                  className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mode toggle tab bar ──────────────────────────────────────────────────────

function ModeToggle({ mode, onChange, t }) {
  return (
    <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
      <button
        type="button"
        onClick={() => onChange('guided')}
        className={[
          'flex-1 rounded-lg py-2 text-xs font-semibold transition-all',
          mode === 'guided'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ].join(' ')}
      >
        {t('upload.guided.title')}
        {mode === 'guided' && (
          <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
            {t('upload.guided.recommended')}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onChange('quick')}
        className={[
          'flex-1 rounded-lg py-2 text-xs font-semibold transition-all',
          mode === 'quick'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ].join(' ')}
      >
        {t('upload.quick.title')}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocumentUploadCard({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()

  const [mode, setMode] = useState('guided') // 'guided' | 'quick'

  // Guided: { [docKey]: [{ id, file, objectUrl }] }
  const [slotFiles, setSlotFiles] = useState({})
  const [slotErrors, setSlotErrors] = useState({})

  // Quick: [{ id, file, objectUrl, labels: string[] }]
  const [quickFiles, setQuickFiles] = useState([])

  const claimNotes = '' // disabled in current sprint
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)

  const requiredDocs = payload?.required_docs || []
  const hasSlots = requiredDocs.length > 0

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return t('upload.error.fileType')
    if (file.size > MAX_SIZE_BYTES) return t('upload.error.fileSize')
    return null
  }

  function makeFileItem(file) {
    return { id: makeId(), file, objectUrl: URL.createObjectURL(file) }
  }

  // ── canSubmit — only checks the active mode ──
  const canSubmit = useMemo(() => {
    if (mode === 'guided') {
      return hasSlots
        ? requiredDocs.filter((d) => d.required).every((d) => (slotFiles[d.key] || []).length > 0)
        : Object.values(slotFiles).some((arr) => arr.length > 0)
    }
    // Quick mode: every required doc must appear as a tag on at least one file
    if (!hasSlots) return quickFiles.length > 0
    return requiredDocs
      .filter((d) => d.required)
      .every((d) => quickFiles.some((f) => f.labels.includes(d.key)))
  }, [mode, hasSlots, requiredDocs, slotFiles, quickFiles])

  // ── Guided handlers ──
  function handleSlotFilesAdded(docKey, files) {
    const valid = []
    let lastError = null
    files.forEach((file) => {
      const err = validateFile(file)
      if (err) { lastError = err } else { valid.push(makeFileItem(file)) }
    })
    if (lastError) setSlotErrors((prev) => ({ ...prev, [docKey]: lastError }))
    if (valid.length) {
      setSlotErrors((prev) => { const next = { ...prev }; delete next[docKey]; return next })
      setSlotFiles((prev) => ({ ...prev, [docKey]: [...(prev[docKey] || []), ...valid] }))
    }
  }

  function handleSlotFileRemoved(docKey, fileId) {
    setSlotFiles((prev) => {
      const removed = (prev[docKey] || []).find((f) => f.id === fileId)
      if (removed?.objectUrl) URL.revokeObjectURL(removed.objectUrl)
      return { ...prev, [docKey]: (prev[docKey] || []).filter((f) => f.id !== fileId) }
    })
  }

  // ── Quick handlers ──
  function handleQuickFilesAdded(files) {
    const valid = []
    files.forEach((file) => {
      if (!validateFile(file)) valid.push({ ...makeFileItem(file), labels: [] })
    })
    setQuickFiles((prev) => [...prev, ...valid])
  }

  function handleQuickFileRemoved(fileId) {
    setQuickFiles((prev) => {
      const removed = prev.find((f) => f.id === fileId)
      if (removed?.objectUrl) URL.revokeObjectURL(removed.objectUrl)
      return prev.filter((f) => f.id !== fileId)
    })
  }

  function handleToggleLabel(fileId, labelKey) {
    setQuickFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f
        // Single-select: tap the active label to deselect, tap another to replace
        const isActive = f.labels.includes(labelKey)
        return { ...f, labels: isActive ? [] : [labelKey] }
      })
    )
  }

  // ── Submit ──
  function handleSubmit() {
    if (!canSubmit || uploading) return
    setUploading(true)
    try {
      const files = []
      const documentTypes = []

      if (mode === 'guided') {
        requiredDocs.forEach((doc) => {
          ;(slotFiles[doc.key] || []).forEach((item) => {
            files.push(item.file)
            documentTypes.push(doc.key)
          })
        })
        // generic mode (no slots)
        if (!hasSlots) {
          Object.entries(slotFiles).forEach(([key, items]) => {
            items.forEach((item) => {
              files.push(item.file)
              documentTypes.push(key)
            })
          })
        }
      } else {
        quickFiles.forEach((item) => {
          files.push(item.file)
          // join multiple labels with comma; n8n can split on its side
          documentTypes.push(item.labels.length ? item.labels.join(',') : 'other')
        })
      }

      onSubmit({ files, documentTypes, claimNotes })
    } finally {
      setUploading(false)
    }
  }

  // ── Submitted state ──
  if (submitted) {
    const count =
      Object.values(slotFiles).reduce((s, arr) => s + arr.length, 0) + quickFiles.length
    return (
      <div className="mx-4 my-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <CheckIcon />
        <span className="text-sm text-green-700">
          {count} {t('upload.progress.done')}
        </span>
      </div>
    )
  }

  return (
    <>
      {previewItem && (
        <FilePreviewModal
          file={previewItem.file}
          objectUrl={previewItem.objectUrl}
          onClose={() => setPreviewItem(null)}
        />
      )}

      <div className="mx-4 my-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-gray-900">{t('upload.card.title')}</p>
        <p className="mb-3 text-xs text-gray-500">
          {payload?.message || t('upload.card.subtitle')}
        </p>

        {/* OCR warning — shown when previous upload attempt failed */}
        {payload?.upload_warning && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs leading-snug text-amber-700">{payload.upload_warning}</p>
          </div>
        )}

        {/* Mode toggle */}
        <ModeToggle mode={mode} onChange={setMode} t={t} />

        {/* Active panel */}
        <div className="mb-4">
          {mode === 'guided' ? (
            hasSlots ? (
              <div className="space-y-2">
                {requiredDocs.map((doc) => (
                  <DocSlot
                    key={doc.key}
                    doc={doc}
                    files={slotFiles[doc.key] || []}
                    error={slotErrors[doc.key] || null}
                    onFilesAdded={handleSlotFilesAdded}
                    onFileRemoved={handleSlotFileRemoved}
                    onPreview={setPreviewItem}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-brand-400 hover:bg-brand-50"
                onClick={() => document.getElementById('generic-upload-input')?.click()}
              >
                <UploadIcon />
                <p className="mt-2 text-xs text-gray-500">{t('upload.card.dragDrop')}</p>
                <p className="mt-1 text-xs text-gray-400">{t('upload.card.hint')}</p>
                <input
                  id="generic-upload-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    Array.from(e.target.files || []).forEach((f) => handleSlotFilesAdded('file', [f]))
                    e.target.value = ''
                  }}
                />
              </div>
            )
          ) : (
            <QuickUploadPanel
              quickFiles={quickFiles}
              labelOptions={requiredDocs}
              onFilesAdded={handleQuickFilesAdded}
              onFileRemoved={handleQuickFileRemoved}
              onToggleLabel={handleToggleLabel}
              onPreview={setPreviewItem}
              t={t}
            />
          )}
        </div>

        {/* Claim notes — disabled in current sprint */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-400">
            {t('upload.card.notesLabel')}
          </label>
          <textarea
            rows={2}
            value=""
            disabled
            placeholder={t('upload.card.notesComingSoon')}
            className="w-full cursor-not-allowed resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 opacity-60"
          />
        </div>

        {/* One-doc-per-file info */}
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs leading-snug text-blue-700">{t('upload.oneDocHint')}</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || uploading}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? t('upload.progress.uploading') : t('upload.card.button')}
        </button>
      </div>
    </>
  )
}
