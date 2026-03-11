import { useCallback } from 'react'
import { useClaimContext } from '../context/ClaimContext'
import { useSession } from '../context/SessionContext'
import * as webhookService from '../services/webhookService'

// Maps n8n response type → next claimFlowState
const TYPE_TO_STATE = {
  benefit_type_selector: 'BENEFIT_TYPE_PENDING',
  document_upload:       'UPLOAD_PENDING',
  claimant_selector:     'CLAIMANT_PENDING',
  processing_steps:      'ANALYZING_DOCS',
  extracted_form:        'DATA_EXTRACTED',
  iban_input:            'IBAN_PENDING',
  financial_summary:     'AWAITING_SUBMISSION',
  warning_banner:        'POLICY_CHECKED',
  success_card:          'SUBMITTED',
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

  function handleResponse(response) {
    // Normalise raw n8n agent output ({ output: "..." }) into the standard shape
    let data = response.data
    if (!data.type && data.output) {
      data = { type: 'assistant_text', message: data.output, resumeUrl: data.resumeUrl }
    }

    // Always sync resumeUrl — clears it when n8n ends an execution without one
    dispatch({ type: 'SET_RESUME_URL', payload: response.resumeUrl || null })

    addMessage(data.type, data)

    const nextState = TYPE_TO_STATE[data.type]
    if (nextState) {
      dispatch({ type: 'SET_FLOW_STATE', payload: nextState })
    }

    if (data.extracted_data) {
      dispatch({ type: 'UPDATE_CLAIM_DATA', payload: data.extracted_data })
    }

    if (data.type === 'success_card') {
      dispatch({
        type: 'SET_SUBMITTED',
        payload: { claim_id: data.claim_id, processing_type: data.processing_type },
      })
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

  /** Called when user sends a free-text message — resumes Wait node if mid-flow,
   *  otherwise starts a new execution at the initial webhook. */
  const sendUserMessage = useCallback(
    (text) => {
      addMessage('user_text', { message: text })
      if (state.claimFlowState === 'IDLE') {
        dispatch({ type: 'SET_FLOW_STATE', payload: 'GREETING' })
      }
      return withLoading(
        () => webhookService.postUserMessage(session, text, state.resumeUrl),
        { type: 'userMessage', text }
      )
    },
    [session, state.claimFlowState, state.resumeUrl, dispatch]
  )

  /** Called when BenefitTypeSelectorWidget submits */
  const submitBenefitType = useCallback(
    (data, messageId) => {
      const benefitType = data.benefit_type ?? data
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'SET_FLOW_STATE', payload: 'BENEFIT_TYPE_SELECTED' })
      dispatch({ type: 'UPDATE_CLAIM_DATA', payload: { benefit_category: benefitType } })
      return withLoading(
        () => webhookService.postBenefitType(state.resumeUrl, data, session.session_token),
        { type: 'benefitType', benefitData: data }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called when DocumentUploadCard submits — sends binary FormData */
  const submitDocumentUpload = useCallback(
    ({ files, documentTypes, claimNotes }, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'SET_FLOW_STATE', payload: 'ANALYZING_DOCS' })
      const benefitType = state.claimData.benefit_category
      return withLoading(
        () => webhookService.postDocumentUpload(
          state.resumeUrl,
          files,
          documentTypes,
          benefitType,
          claimNotes,
          session.session_token
        ),
        { type: 'documentUpload', files, documentTypes, claimNotes }
      )
    },
    [session, state.resumeUrl, state.claimData.benefit_category, dispatch]
  )

  /** Called when ClaimantSelectorWidget submits */
  const submitClaimantSelection = useCallback(
    (selectedClaimantId, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'SET_FLOW_STATE', payload: 'CLAIMANT_VERIFIED' })
      return withLoading(
        () => webhookService.postClaimantSelection(state.resumeUrl, selectedClaimantId, session.session_token),
        { type: 'claimantSelection', selectedClaimantId }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called by ProcessingSteps after animation completes */
  const submitProcessingComplete = useCallback(
    (messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postProcessingComplete(state.resumeUrl, session.session_token),
        { type: 'processingComplete' }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called when ExtractedDataForm submits */
  const submitForm = useCallback(
    (formData, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'SET_FLOW_STATE', payload: 'AWAITING_CONFIRMATION' })
      return withLoading(
        () => webhookService.postFormConfirmation(state.resumeUrl, formData, session.session_token),
        { type: 'formConfirmation', formData }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called when WarningBanner submits — acknowledges flags, resumes Stage 2 Wait node */
  const submitWarning = useCallback(
    (proceedAction, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postWarningAction(state.resumeUrl, proceedAction, session.session_token),
        { type: 'warningAction', proceedAction }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called when IbanInputWidget submits */
  const submitIban = useCallback(
    (ibanData, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      return withLoading(
        () => webhookService.postIbanConfirmation(state.resumeUrl, ibanData, session.session_token),
        { type: 'ibanConfirmation', ibanData }
      )
    },
    [session, state.resumeUrl, dispatch]
  )

  /** Called when FinancialSummaryCard or WarningBanner submits */
  const submitFinal = useCallback(
    (submitAction, messageId) => {
      dispatch({ type: 'MARK_WIDGET_SUBMITTED', payload: messageId })
      dispatch({ type: 'SET_FLOW_STATE', payload: 'SUBMITTING' })
      return withLoading(
        () => webhookService.postFinalSubmission(state.resumeUrl, submitAction, session.session_token),
        { type: 'finalSubmission', submitAction }
      )
    },
    [session, state.resumeUrl, dispatch]
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
      case 'benefitType':      return submitBenefitType(req.benefitData)
      case 'documentUpload':   return submitDocumentUpload({ files: req.files, documentTypes: req.documentTypes, claimNotes: req.claimNotes })
      case 'claimantSelection': return submitClaimantSelection(req.selectedClaimantId)
      case 'formConfirmation': return submitForm(req.formData)
      case 'ibanConfirmation': return submitIban(req.ibanData)
      case 'warningAction':    return submitWarning(req.proceedAction)
      case 'finalSubmission':  return submitFinal(req.submitAction)
      default: break
    }
  }, [state.lastFailedRequest, sendUserMessage, submitBenefitType, submitDocumentUpload, submitClaimantSelection, submitForm, submitIban, submitWarning, submitFinal])

  return {
    messages: state.messages,
    claimFlowState: state.claimFlowState,
    isLoading: state.isLoading,
    isSubmitted: state.claimFlowState === 'SUBMITTED',
    sendUserMessage,
    submitBenefitType,
    submitDocumentUpload,
    submitClaimantSelection,
    submitProcessingComplete,
    submitForm,
    submitWarning,
    submitIban,
    submitFinal,
    retryLast,
    resetChat,
    addMessage,
  }
}
