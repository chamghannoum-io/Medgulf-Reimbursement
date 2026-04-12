import { useCallback } from 'react'
import { useClaimContext } from '../context/ClaimContext'
import { useSession } from '../context/SessionContext'
import * as webhookService from '../services/webhookService'

// Maps updated_stage values from n8n → widget message type for rendering
const STAGE_TO_WIDGET_TYPE = {
  S1_BENEFIT_SELECTOR:  'benefit_type_selector',
  S2_DOC_UPLOAD:        'document_upload',
  S3_OCR_REVIEW:        'extracted_form',
  S4_IBAN:              'iban_input',
  S4_SUMMARY:           'summary_card',
  S5_FINANCIAL_SUMMARY: 'financial_summary',
  COMPLETED:            'success_card',
}

export function useClaimFlow() {
  const { state, dispatch } = useClaimContext()
  const { session } = useSession()

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------
  function setLoading(val) {
    dispatch({ type: 'SET_LOADING', payload: val })
  }

  function addMessage(type, payload) {
    dispatch({ type: 'ADD_MESSAGE', payload: { type, payload } })
  }

  function addErrorMessage() {
    addMessage('assistant_text', { message: null, isError: true })
  }

  /**
   * Processes the new n8n envelope: { output, updated_stage, updated_claim }
   * - Always renders an assistant_text bubble for `output`
   * - Merges updated_claim into claimData
   * - Advances flow state to updated_stage
   * - Renders the appropriate widget for the new stage (if any)
   */
  function handleResponse(response) {
    const { data, access_token } = response

    if (!data) return

    const { output, updated_stage, updated_claim } = data

    // 1. Store access_token if provided
    if (access_token) {
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: access_token })
    }

    // 2. Merge claim data
    if (updated_claim && Object.keys(updated_claim).length > 0) {
      dispatch({ type: 'MERGE_CLAIM_DATA', payload: updated_claim })
    }

    // 3. Advance flow state
    if (updated_stage) {
      dispatch({ type: 'SET_FLOW_STATE', payload: updated_stage })
    }

    // 4. Parse output — n8n may send the widget payload as a stringified JSON in
    //    the output field instead of (or in addition to) updated_claim.
    //    If output is a JSON string, parse it and use it as the widget payload.
    let parsedOutput = null
    let displayMessage = output
    if (typeof output === 'string' && output.trimStart().startsWith('{')) {
      try {
        parsedOutput = JSON.parse(output)
        // The parsed object may carry a human-readable "message" field — use that
        // as the assistant bubble text instead of the raw JSON
        displayMessage = parsedOutput.message ?? null
      } catch {
        // Not valid JSON — treat as plain text
      }
    }

    if (displayMessage) {
      addMessage('assistant_text', { message: displayMessage })
    }

    // 5. Widget bubble for interactive stages
    const widgetType = STAGE_TO_WIDGET_TYPE[updated_stage]
    if (widgetType) {
      if (updated_stage === 'COMPLETED') {
        dispatch({
          type: 'SET_SUBMITTED',
          payload: {
            claim_id: updated_claim?.claim_id,
            processing_type: updated_claim?.processing_type,
          },
        })
        addMessage('success_card', { ...updated_claim, message: displayMessage })
      } else {
        // Prefer parsed widget payload from output; fall back to updated_claim
        addMessage(widgetType, parsedOutput ?? updated_claim ?? {})
      }
    }
  }

  async function withLoading(fn, requestData) {
    dispatch({ type: 'SAVE_LAST_REQUEST', payload: requestData })
    setLoading(true)
    try {
      const result = await fn()
      dispatch({ type: 'CLEAR_LAST_REQUEST' })
      handleResponse(result)
    } catch (err) {
      addErrorMessage()
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /** Free-text message — starts flow on IDLE, sent to intent classifier otherwise */
  const sendUserMessage = useCallback(
    (text) => {
      addMessage('user_text', { message: text })
      if (state.claimFlowState === 'IDLE') {
        dispatch({ type: 'SET_FLOW_STATE', payload: 'GREETING' })
      }
      return withLoading(
        () => webhookService.postUserMessage(session, text),
        { type: 'userMessage', text }
      )
    },
    [session, state.claimFlowState, dispatch]
  )

  /** Structured action — bypasses intent classifier (used by quick-action buttons) */
  const sendAction = useCallback(
    (action, payload, displayText) => {
      addMessage('user_text', { message: displayText })
      if (state.claimFlowState === 'IDLE') {
        dispatch({ type: 'SET_FLOW_STATE', payload: 'GREETING' })
      }
      return withLoading(
        () => webhookService.postAction(session, action, payload),
        { type: 'action', action, payload, displayText }
      )
    },
    [session, state.claimFlowState, dispatch]
  )

  /** S1 — BenefitTypeSelectorWidget submits */
  const submitBenefitType = useCallback(
    ({ benefit_type, for_dependent_id, for_dependent_name }, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postBenefitSelected(session, benefit_type, for_dependent_id, for_dependent_name),
        { type: 'benefitSelected', benefit_type, for_dependent_id, for_dependent_name }
      )
    },
    [session, dispatch]
  )

  /** S2 — DocumentUploadCard submits — documents are URL refs from file service */
  const submitDocumentUpload = useCallback(
    ({ documents }, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postDocumentsUploaded(session, documents),
        { type: 'documentsUploaded', documents }
      )
    },
    [session, state.access_token, dispatch]
  )

  /** S3 — ExtractedDataForm confirms or edits OCR data.
   *  The form calls onSubmit({ ...fieldValues, is_user_edited }) — a flat spread.
   *  We pull is_user_edited out and treat the rest as extracted_data.
   *  On re-submission (user edited after confirming), trim the stale summary
   *  card and any messages that followed it so n8n can replace them cleanly. */
  const submitForm = useCallback(
    (formData, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'REMOVE_MESSAGES_AFTER', payload: messageId })
      const { is_user_edited, ...extracted_data } = formData
      return withLoading(
        () => webhookService.postOcrConfirmed(session, extracted_data, is_user_edited),
        { type: 'ocrConfirmed', extracted_data, is_user_edited }
      )
    },
    [session, dispatch]
  )

  /** S4 — IbanInputWidget submits */
  const submitIban = useCallback(
    ({ iban, iban_action, bank_name }, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postIbanSelected(session, iban, iban_action, bank_name),
        { type: 'ibanSelected', iban, iban_action, bank_name }
      )
    },
    [session, dispatch]
  )

  /** S4_SUMMARY / S5 — Combined summary card or financial summary confirms submission */
  const submitFinal = useCallback(
    (data, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      // If the user changed IBAN inline, carry it through; otherwise just submit
      const ibanOverride = data?.iban ?? null
      dispatch({ type: 'SET_FLOW_STATE', payload: 'SUBMITTING' })
      return withLoading(
        () => webhookService.postSubmitConfirmed(session, ibanOverride),
        { type: 'submitConfirmed', iban: ibanOverride }
      )
    },
    [session, dispatch]
  )

  /** Reset the entire claim flow back to initial state */
  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [dispatch])

  /** Retry the last failed request */
  const retryLast = useCallback(() => {
    const req = state.lastFailedRequest
    if (!req) return
    switch (req.type) {
      case 'userMessage':      return sendUserMessage(req.text)
      case 'action':           return sendAction(req.action, req.payload, req.displayText)
      case 'benefitSelected':  return submitBenefitType({ benefit_type: req.benefit_type, for_dependent_id: req.for_dependent_id, for_dependent_name: req.for_dependent_name })
      case 'documentsUploaded':return submitDocumentUpload({ documents: req.documents })
      case 'ocrConfirmed':     return submitForm({ ...req.extracted_data, is_user_edited: req.is_user_edited })
      case 'ibanSelected':     return submitIban({ iban: req.iban, iban_action: req.iban_action, bank_name: req.bank_name })
      case 'submitConfirmed':  return submitFinal(null)
      default: break
    }
  }, [state.lastFailedRequest, sendUserMessage, sendAction, submitBenefitType, submitDocumentUpload, submitForm, submitIban, submitFinal])

  return {
    messages: state.messages,
    claimFlowState: state.claimFlowState,
    claimData: state.claimData,
    access_token: state.access_token,
    isLoading: state.isLoading,
    isSubmitted: state.claimFlowState === 'COMPLETED',
    sendUserMessage,
    sendAction,
    submitBenefitType,
    submitDocumentUpload,
    submitForm,
    submitIban,
    submitFinal,
    retryLast,
    resetChat,
    addMessage,
  }
}
