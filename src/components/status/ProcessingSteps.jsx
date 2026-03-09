import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LINE_INTERVAL_MS = 2800
const MAX_VISIBLE      = 3

export default function ProcessingSteps({ payload, onSubmit, submitted }) {
  const { t } = useTranslation()
  const stream = useMemo(() => t('processing.stream', { returnObjects: true }), [t])

  // lines: last MAX_VISIBLE entries, each { text, key }
  const [lines,     setLines]     = useState([{ text: stream[0], key: 0 }])
  const [latestKey, setLatestKey] = useState(0)

  const counterRef      = useRef(1)
  const calledSubmit    = useRef(false)

  useEffect(() => {
    if (submitted) return

    const interval = setInterval(() => {
      // Loop back to start when we reach the end
      const streamIdx = counterRef.current % stream.length
      const key       = counterRef.current

      setLines((prev) => [...prev, { text: stream[streamIdx], key }].slice(-MAX_VISIBLE))
      setLatestKey(key)

      // Trigger onSubmit after the first full pass (if provided)
      if (counterRef.current === stream.length - 1 && !calledSubmit.current && onSubmit) {
        calledSubmit.current = true
        onSubmit({})
      }

      counterRef.current++
    }, LINE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [submitted, stream.length, onSubmit])

  return (
    <div className="mx-4 my-2 overflow-hidden rounded-2xl border border-brand-100 bg-white px-5 py-5 shadow-md">

      {/* Header row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50">
          {submitted ? (
            <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 animate-spin-slow text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          {submitted ? t('processing.complete') : t('processing.title')}
        </span>
      </div>

      {/* Streaming lines */}
      <div className="space-y-2 ps-11">
        {lines.map((line, i) => {
          const age      = lines.length - 1 - i   // 0 = newest
          const isLatest = !submitted && age === 0
          const opacity  = submitted ? 1 : Math.max(0.15, 1 - age * 0.4)

          return (
            <p
              key={line.key}
              className={`text-sm leading-relaxed transition-colors duration-300 ${
                isLatest ? 'font-medium text-brand-700' : 'text-gray-400'
              }`}
              style={{
                opacity,
                animation: line.key === latestKey && !submitted
                  ? 'mg-slide-in 0.4s ease-out'
                  : undefined,
              }}
            >
              {line.text}
            </p>
          )
        })}

        {/* Blinking cursor */}
        {!submitted && (
          <span
            className="inline-block h-3.5 w-0.5 translate-y-0.5 rounded-sm bg-brand-400"
            style={{ animation: 'mg-cursor 1s step-end infinite' }}
          />
        )}
      </div>

      <style>{`
        @keyframes mg-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes mg-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
