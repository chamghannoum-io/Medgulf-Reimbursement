import React, { createContext, useContext, useReducer } from 'react'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
const INITIAL_STATE = {
  claimFlowState: 'IDLE',
  resumeUrl: null,
  isLoading: false,
  lastFailedRequest: null,

  messages: [],

  claimData: {
    claimant_name: null,
    policy_number: null,
    provider_name: null,
    provider_country: null,
    service_date: null,
    claim_notes: null,
    benefit_category: null,
    diagnosis_code: null,
    service_code: null,
    claim_amount: null,
    VAT: null,
    deductible: null,
    IBAN: null,
    is_user_edited: false,
    is_doc_unclear: false,
    geo_check_status: null,
    is_service_uncovered: false,
  },

  submittedClaimId: null,
  processingType: null,
}

// ---------------------------------------------------------------------------
// Valid state transitions
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  IDLE: ['GREETING'],
  GREETING: ['BENEFIT_TYPE_PENDING', 'UPLOAD_PENDING'],
  BENEFIT_TYPE_PENDING: ['BENEFIT_TYPE_SELECTED', 'DRAFT_SAVED'],
  BENEFIT_TYPE_SELECTED: ['UPLOAD_PENDING', 'DRAFT_SAVED'],
  UPLOAD_PENDING: ['ANALYZING_DOCS', 'CLAIMANT_PENDING', 'DRAFT_SAVED'],
  CLAIMANT_PENDING: ['CLAIMANT_VERIFIED', 'DRAFT_SAVED'],
  CLAIMANT_VERIFIED: ['ANALYZING_DOCS', 'DRAFT_SAVED'],
  ANALYZING_DOCS: ['DATA_EXTRACTED', 'DRAFT_SAVED'],
  DATA_EXTRACTED: ['AWAITING_CONFIRMATION', 'DRAFT_SAVED'],
  AWAITING_CONFIRMATION: ['POLICY_CHECKING', 'DRAFT_SAVED'],
  POLICY_CHECKING: ['POLICY_CHECKED', 'DRAFT_SAVED'],
  POLICY_CHECKED: ['IBAN_PENDING', 'DRAFT_SAVED'],
  IBAN_PENDING: ['IBAN_VERIFIED', 'IBAN_PENDING', 'DRAFT_SAVED'],
  IBAN_VERIFIED: ['AWAITING_SUBMISSION', 'DRAFT_SAVED'],
  AWAITING_SUBMISSION: ['SUBMITTING', 'DRAFT_SAVED'],
  SUBMITTING: ['SUBMITTED'],
  SUBMITTED: [],
  DRAFT_SAVED: ['BENEFIT_TYPE_PENDING', 'UPLOAD_PENDING', 'CLAIMANT_PENDING', 'CLAIMANT_VERIFIED', 'ANALYZING_DOCS'],
}

let msgIdCounter = 0
function nextId() {
  return `msg-${++msgIdCounter}`
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function claimReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_FLOW_STATE': {
      const next = action.payload
      const allowed = VALID_TRANSITIONS[state.claimFlowState] || []
      if (!allowed.includes(next)) {
        console.warn(`[ClaimContext] Invalid transition: ${state.claimFlowState} → ${next}`)
        return state
      }
      return { ...state, claimFlowState: next }
    }

    case 'SET_RESUME_URL':
      return { ...state, resumeUrl: action.payload }

    case 'ADD_MESSAGE': {
      const msg = {
        id: nextId(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      return { ...state, messages: [...state.messages, msg] }
    }

    case 'MARK_WIDGET_SUBMITTED': {
      // Make the widget at messageId read-only
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload ? { ...m, submitted: true } : m
        ),
      }
    }

    case 'UPDATE_CLAIM_DATA':
      return {
        ...state,
        claimData: { ...state.claimData, ...action.payload },
      }

    case 'SET_SUBMITTED':
      return {
        ...state,
        claimFlowState: 'SUBMITTED',
        submittedClaimId: action.payload.claim_id,
        processingType: action.payload.processing_type,
      }

    case 'SAVE_LAST_REQUEST':
      return { ...state, lastFailedRequest: action.payload }

    case 'CLEAR_LAST_REQUEST':
      return { ...state, lastFailedRequest: null }

    case 'RESET':
      return { ...INITIAL_STATE }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ClaimContext = createContext(null)

export function ClaimProvider({ children }) {
  const [state, dispatch] = useReducer(claimReducer, INITIAL_STATE)
  return (
    <ClaimContext.Provider value={{ state, dispatch }}>
      {children}
    </ClaimContext.Provider>
  )
}

export function useClaimContext() {
  const ctx = useContext(ClaimContext)
  if (!ctx) throw new Error('useClaimContext must be used inside ClaimProvider')
  return ctx
}
