import React from 'react'
import { useTranslation } from 'react-i18next'
import medgulfLogo from '../../assets/medgulf-logo.jpg'

const MessageBubble = React.memo(function MessageBubble({ payload, side = 'left' }) {
  const { t } = useTranslation()
  const isLeft = side === 'left'
  const message = payload?.message ?? (payload?.isError ? t('chat.error.generic') : '')

  return (
    <div
      className={`flex items-end gap-2 px-4 py-1 ${isLeft ? 'justify-start' : 'flex-row-reverse rtl:flex-row'}`}
    >
      {/* Avatar — assistant only */}
      {isLeft && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-100 bg-white shadow-sm">
          <img src={medgulfLogo} alt="Medgulf" className="h-5 w-auto object-contain" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isLeft
            ? 'rounded-bl-none bg-white text-gray-800'
            : 'rounded-br-none bg-brand-600 text-white rtl:rounded-br-2xl rtl:rounded-bl-none'
        } ${payload?.isError ? 'border border-red-200 bg-red-50 text-red-700' : ''}`}
      >
        {message}
      </div>
    </div>
  )
})

export default MessageBubble
