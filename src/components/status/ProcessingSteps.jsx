import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const ROTATE_INTERVAL_MS = 2200

export default function ProcessingSteps({ submitted }) {
  const { t } = useTranslation()
  const stream = useMemo(() => t('processing.stream', { returnObjects: true }), [t])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)   // drives fade transition

  useEffect(() => {
    if (submitted) return

    const interval = setInterval(() => {
      // Fade out, swap text, fade back in
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % stream.length)
        setVisible(true)
      }, 250)
    }, ROTATE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [submitted, stream.length])

  // onSubmit is null when rendered from ChatWindow (loading indicator);
  // the real submit path for the processing_steps widget type is not used here.
  // Nothing to auto-advance — n8n response arrival drives the next step.

  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-md">
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
      <span
        className="text-sm font-medium text-brand-700 transition-opacity duration-200"
        style={{ opacity: submitted ? 1 : visible ? 1 : 0 }}
      >
        {submitted ? t('processing.complete') : stream[currentIndex]}
      </span>
    </div>
  )
}
