import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../context/SessionContext'
import { useVoiceInput } from '../../hooks/useVoiceInput'

export default function InputBar({ onSend, disabled }) {
  const { t } = useTranslation()
  const { session } = useSession()
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const { isListening, isSupported, start, stop } = useVoiceInput({
    language: session.language,
    onResult: (transcript) => {
      setText((prev) => (prev ? prev + ' ' + transcript : transcript))
      textareaRef.current?.focus()
    },
  })

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`border-t border-gray-200 bg-white px-4 py-3 ${disabled ? 'opacity-60' : ''}`}
      title={disabled ? t('chat.input.disabled') : ''}
    >
      <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? t('chat.input.disabled') : t('chat.input.placeholder')}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:cursor-not-allowed max-h-[120px] overflow-y-auto"
        />

        {/* Voice button */}
        {isSupported && (
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={disabled}
            aria-label={t('chat.input.voice')}
            className={`rounded-lg p-1.5 transition-colors ${
              isListening
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            } disabled:pointer-events-none`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label={t('chat.input.send')}
          className="rounded-lg bg-brand-600 p-1.5 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
