import React from 'react'
import { useTranslation } from 'react-i18next'

export default function UploadProgressBar({ progress = 0, done = false }) {
  const { t } = useTranslation()
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{done ? t('upload.progress.done') : t('upload.progress.uploading')}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
