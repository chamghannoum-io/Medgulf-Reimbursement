import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../context/SessionContext'
import medgulfLogo from '../../assets/medgulf-logo.jpg'
import { useClaimFlow } from '../../hooks/useClaimFlow'
import MessageFactory from './MessageFactory'
import TypingIndicator from './TypingIndicator'
import ProcessingSteps from '../status/ProcessingSteps'
import InputBar from './InputBar'
import QuickActions from './QuickActions'

// Defined at module level — stable Set reference, never recreated
const WIDGET_TYPES = new Set([
  'benefit_type_selector',
  'document_upload',
  'claimant_selector',
  'processing_steps',
  'extracted_form',
  'iban_input',
  'warning_banner',
  'financial_summary',
  'confirmation_dialog',
])

export default function ChatWindow() {
  const { t } = useTranslation()
  const { session, changeLanguage } = useSession()
  const flow = useClaimFlow()
  const bottomRef = useRef(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(true)
  const initialised = useRef(false)

  // On mount: greet the user — n8n is only called when the user sends a message
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    flow.addMessage('assistant_text', { translationKey: 'chat.greeting' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [flow.messages, flow.isLoading])

  // O(n) scan memoized — only reruns when messages array changes
  const lastWidgetIndex = useMemo(() => {
    for (let i = flow.messages.length - 1; i >= 0; i--) {
      if (WIDGET_TYPES.has(flow.messages[i].type)) return i
    }
    return -1
  }, [flow.messages])

  const handleNewChat = useCallback(() => {
    flow.resetChat()
    flow.addMessage('assistant_text', { translationKey: 'chat.greeting' })
    setQuickActionsVisible(true)
  }, [flow.resetChat, flow.addMessage, t])

  // Stable function reference — only changes when the flow submit methods change
  const getOnSubmit = useCallback((message) => (data) => {
    switch (message.type) {
      case 'benefit_type_selector':
        flow.submitBenefitType(data, message.id)
        break
      case 'document_upload':
        flow.submitDocumentUpload(data, message.id)
        break
      case 'claimant_selector':
        flow.submitClaimantSelection(data.selected_claimant_id, message.id)
        break
      case 'processing_steps':
        flow.submitProcessingComplete(message.id)
        break
      case 'extracted_form':
        flow.submitForm(data, message.id)
        break
      case 'iban_input':
        flow.submitIban(data, message.id)
        break
      case 'warning_banner':
        flow.submitWarning(data, message.id)
        break
      case 'financial_summary':
      case 'confirmation_dialog':
        flow.submitFinal(data, message.id)
        break
      case 'success_card':
        handleNewChat()
        break
      default:
        break
    }
  }, [
    flow.submitBenefitType,
    flow.submitDocumentUpload,
    flow.submitClaimantSelection,
    flow.submitProcessingComplete,
    flow.submitForm,
    flow.submitIban,
    flow.submitWarning,
    flow.submitFinal,
    handleNewChat,
  ])

  function handleRetry() {
    flow.retryLast()
  }

  return (
    <div className="flex h-full flex-col bg-[#f5f7fb] font-sans rtl:font-arabic">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-brand-100 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={medgulfLogo}
            alt="Medgulf"
            className="h-10 w-auto object-contain"
          />
          <div className="hidden h-5 w-px bg-gray-200 sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-brand-700">{t('chat.header.title')}</p>
            <p className="text-xs text-gray-500">{t('chat.header.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            aria-label={t('chat.header.notifications')}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => changeLanguage(session.language === 'ar' ? 'en' : 'ar')}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
          >
            {t('chat.header.languageToggle')}
          </button>
        </div>
      </header>

      {/* Notification panel (simple overlay) */}
      {notificationsOpen && (
        <div className="absolute end-4 top-16 z-10 w-[calc(100vw-2rem)] max-w-xs rounded-xl border border-gray-200 bg-white shadow-lg sm:w-80">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{t('notifications.centre')}</p>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="px-4 py-6 text-center text-sm text-gray-500">{t('notifications.empty')}</p>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {flow.messages.map((msg, index) => (
          <div key={msg.id} className="mb-2">
            <MessageFactory
              message={msg}
              onSubmit={getOnSubmit(msg)}
              isLastWidget={index === lastWidgetIndex}
            />
          </div>
        ))}

        {/* Error retry row */}
        {flow.messages.length > 0 &&
          flow.messages[flow.messages.length - 1]?.payload?.isError && (
            <div className="flex justify-start px-14 py-1">
              <button
                onClick={handleRetry}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                {t('chat.error.retry')}
              </button>
            </div>
          )}

        {/* Loading indicator — show ProcessingSteps only while waiting for the first OCR response;
            once the processing_steps message is in the thread it handles its own animation */}
        {flow.isLoading && (() => {
          const hasProcessingStepsMsg = flow.messages.some((m) => m.type === 'processing_steps')
          return flow.claimFlowState === 'ANALYZING_DOCS' && !hasProcessingStepsMsg
            ? <ProcessingSteps submitted={false} onSubmit={null} />
            : <TypingIndicator />
        })()}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions — shown only before the user sends their first message */}
      {quickActionsVisible && !flow.isSubmitted && (
        <QuickActions
          onSelect={(message) => {
            setQuickActionsVisible(false)
            flow.sendUserMessage(message)
          }}
        />
      )}

      {/* Input bar */}
      <InputBar
        disabled={flow.isSubmitted || flow.isLoading}
        onSend={(message) => {
          setQuickActionsVisible(false)
          flow.sendUserMessage(message)
        }}
      />
    </div>
  )
}
