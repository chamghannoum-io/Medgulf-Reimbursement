import React from 'react'
// FilePreview is a pure display component — React.memo prevents re-renders when parent updates
import { useTranslation } from 'react-i18next'

function FileIcon({ type }) {
  if (type === 'application/pdf') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-600">
        PDF
      </span>
    )
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-600">
      IMG
    </span>
  )
}

const FilePreview = React.memo(function FilePreview({ file, docType, onRemove, disabled }) {
  const { t } = useTranslation()
  const sizeKb = Math.round(file.size / 1024)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <FileIcon type={file.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-800">{file.name}</p>
        <p className="text-xs text-gray-400">
          {t(`upload.docType.${docType}`)} · {sizeKb} KB
        </p>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('upload.card.remove')}
          className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
})

export default FilePreview
