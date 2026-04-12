import { createContext, useContext, useReducer } from 'react'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
const INITIAL_STATE = {
  claimFlowState: 'IDLE',
  isLoading: false,
  lastFailedRequest: null,
  access_token: null,

  messages: [],

  // Accumulates updated_claim fields merged from every n8n response
  claimData: {
    // S1
    dependents: null,
    benefit_types: null,
    // S2
    benefit_type: null,
    for_dependent_id: null,
    for_dependent_name: null,
    required_docs: null,
    // S3
    extracted_data: null,
    ocr_confidence: null,
    is_doc_unclear: false,
    // S4
    saved_ibans: null,
    iban: null,
    // S5
    financial_summary: null,
    // S6
    claim_id: null,
    processing_type: null,
    submission_timestamp: null,
  },

  submittedClaimId: null,
  processingType: null,
}

// ---------------------------------------------------------------------------
// Valid state transitions
// n8n stage names drive the flow; frontend states map 1-to-1 to updated_stage values
// plus IDLE, GREETING, SUBMITTING at the edges.
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  IDLE:                ['GREETING'],
  GREETING:            ['S1_BENEFIT_SELECTOR'],
  S1_BENEFIT_SELECTOR: ['S2_DOC_UPLOAD', 'DRAFT_SAVED'],
  S2_DOC_UPLOAD:       ['S3_OCR_REVIEW', 'DRAFT_SAVED'],
  S3_OCR_REVIEW:       ['S3_OCR_REVIEW', 'S4_IBAN', 'S4_SUMMARY', 'DRAFT_SAVED'],
  S4_IBAN:             ['S4_IBAN', 'S5_FINANCIAL_SUMMARY', 'DRAFT_SAVED'],
  S4_SUMMARY:          ['SUBMITTING', 'DRAFT_SAVED'],
  S5_FINANCIAL_SUMMARY:['SUBMITTING', 'DRAFT_SAVED'],
  SUBMITTING:          ['COMPLETED'],
  COMPLETED:           [],
  DRAFT_SAVED:         ['S1_BENEFIT_SELECTOR', 'S2_DOC_UPLOAD', 'S3_OCR_REVIEW'],
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

    case 'ADD_MESSAGE': {
      const msg = {
        id: nextId(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      return { ...state, messages: [...state.messages, msg] }
    }

    case 'MARK_WIDGET_SUBMITTED': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload ? { ...m, submitted: true } : m
        ),
      }
    }

    // Remove all messages that appear after the given message ID (exclusive).
    // Used when re-editing OCR data so the stale summary card is cleared before
    // n8n sends a fresh one.
    case 'REMOVE_MESSAGES_AFTER': {
      const idx = state.messages.findIndex((m) => m.id === action.payload)
      if (idx === -1) return state
      return { ...state, messages: state.messages.slice(0, idx + 1) }
    }

    case 'MERGE_CLAIM_DATA':
      return {
        ...state,
        claimData: { ...state.claimData, ...action.payload },
      }

    case 'SET_SUBMITTED':
      return {
        ...state,
        claimFlowState: 'COMPLETED',
        submittedClaimId: action.payload.claim_id,
        processingType: action.payload.processing_type,
      }

    case 'SAVE_LAST_REQUEST':
      return { ...state, lastFailedRequest: action.payload }

    case 'SET_ACCESS_TOKEN':
      return { ...state, access_token: action.payload }

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
