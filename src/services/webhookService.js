const BASE_URL = import.meta.env.VITE_WEBHOOK_BASE_URL
const CLAIM_CHAT_PATH = '/webhook/claim-chat'
// In dev, use the Vite proxy path (/file-service/...) to avoid CORS.
// In production the same relative path works if the reverse proxy is configured,
// or swap these for the full URL if the prod server handles CORS natively.
const FILE_SERVICE_URL = '/file-service/api/upload'
const FILE_DOWNLOAD_BASE = 'https://api.mg-test.iohealth.com/file-service/api/download'
const TIMEOUT_MS = 30_000
const NO_TIMEOUT  = 0          // used for OCR — duration is unpredictable
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'

// ---------------------------------------------------------------------------
// Mock mode — maps updated_stage → fixture files
// When VITE_USE_MOCK=true, no real HTTP calls are made.
// ---------------------------------------------------------------------------
const MOCK_STAGE_MAP = {
  S1_BENEFIT_SELECTOR: () => import('../mock/n8n/stage0-benefit-type-selector.json'),
  S2_DOC_UPLOAD:       () => import('../mock/n8n/stage0b-document-upload.json'),
  S3_OCR_REVIEW:       () => import('../mock/n8n/stage1-extracted-form.json'),
  S4_IBAN:             () => import('../mock/n8n/stage2-iban-input.json'),
  S4_SUMMARY:          () => import('../mock/n8n/stage3b-summary-card.json'),
  S5_FINANCIAL_SUMMARY:() => import('../mock/n8n/stage3-financial-summary.json'),
  COMPLETED:           () => import('../mock/n8n/stage4-success.json'),
}

// The initial message triggers S1
const MOCK_INITIAL_FIXTURE = MOCK_STAGE_MAP.S1_BENEFIT_SELECTOR

function normalisedResponse(raw) {
  // n8n returns: { status, session_id, data: { output, updated_stage, updated_claim, access_token, ... } }
  // (sometimes as an array wrapper)
  const outer = Array.isArray(raw) ? raw[0] : raw
  const data = outer?.data ?? outer
  // access_token lives inside data (the inner payload), not on the outer envelope
  const access_token = data?.access_token ?? null
  return { data, access_token }
}

async function mockPost(nextStage) {
  await new Promise((r) => setTimeout(r, 800))
  const loader = MOCK_STAGE_MAP[nextStage]
  if (!loader) throw new Error(`[mock] No fixture mapped for stage: ${nextStage}`)
  const mod = await loader()
  return normalisedResponse(mod.default)
}

// ---------------------------------------------------------------------------
// Real HTTP helpers
// ---------------------------------------------------------------------------
function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

async function post(body, token, timeoutMs = TIMEOUT_MS) {
  const url = `${BASE_URL}${CLAIM_CHAT_PATH}`
  const controller = new AbortController()
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (timer) clearTimeout(timer)
    if (err.name === 'AbortError') {
      const timeout = new Error('Request timed out')
      timeout.code = 'TIMEOUT'
      throw timeout
    }
    throw err
  }

  if (timer) clearTimeout(timer)

  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  const raw = await res.json()
  return normalisedResponse(raw)
}

// ---------------------------------------------------------------------------
// Base envelope builder — every request includes session identity
// ---------------------------------------------------------------------------
function baseBody(session) {
  return {
    session_id: session.session_id,
    user_id: session.user_id,
    language: session.language,
  }
}

// ---------------------------------------------------------------------------
// Free-text message — goes through intent classifier
// ---------------------------------------------------------------------------
export async function postUserMessage(session, message) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    const mod = await MOCK_INITIAL_FIXTURE()
    return normalisedResponse(mod.default)
  }

  return post(
    { ...baseBody(session), message },
    session.session_token,
  )
}

// ---------------------------------------------------------------------------
// Generic action — for quick-action buttons and other structured UI triggers
// that should bypass the intent classifier
// ---------------------------------------------------------------------------
export async function postAction(session, action, payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    const mod = await MOCK_INITIAL_FIXTURE()
    return normalisedResponse(mod.default)
  }
  return post(
    { ...baseBody(session), action, payload: payload ?? null },
    session.session_token,
  )
}

// ---------------------------------------------------------------------------
// S1 — Benefit + dependent selection
// ---------------------------------------------------------------------------
export async function postBenefitSelected(session, benefitType, dependentId, dependentName) {
  if (USE_MOCK) return mockPost('S2_DOC_UPLOAD')
  return post(
    {
      ...baseBody(session),
      action: 'BENEFIT_SELECTED',
      payload: {
        benefit_type: benefitType,
        for_dependent_id: dependentId,
        for_dependent_name: dependentName,
      },
    },
    session.session_token,
  )
}

// ---------------------------------------------------------------------------
// File service — upload a single File object, returns the download URL string
// ---------------------------------------------------------------------------
export async function uploadFile(file, token) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    const mockFilename = `mock_${Date.now()}_${file.name}`
    return `${FILE_DOWNLOAD_BASE}/${mockFilename}`
  }

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(FILE_SERVICE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = new Error(`File upload failed: HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  // Response is a plain filename string, e.g. "medical-report_1775729218041.jpg"
  const filename = await res.text()
  return `${FILE_DOWNLOAD_BASE}/${filename.trim()}`
}

// ---------------------------------------------------------------------------
// S2 — Documents uploaded (URLs from file service, not binary)
// documents: [{ url, mimetype, filename, document_type }]
// ---------------------------------------------------------------------------
export async function postDocumentsUploaded(session, documents) {
  if (USE_MOCK) return mockPost('S3_OCR_REVIEW')
  return post(
    {
      ...baseBody(session),
      action: 'DOCUMENTS_UPLOADED',
      payload: { documents },
    },
    session.session_token,
    NO_TIMEOUT,
  )
}

// ---------------------------------------------------------------------------
// S3 — OCR review confirmed (or edited)
// ---------------------------------------------------------------------------
export async function postOcrConfirmed(session, extractedData, isUserEdited) {
  if (USE_MOCK) return mockPost('S4_SUMMARY')
  return post(
    {
      ...baseBody(session),
      action: 'OCR_CONFIRMED',
      payload: {
        extracted_data: extractedData,
        is_user_edited: isUserEdited,
      },
    },
    session.session_token,
  )
}

// ---------------------------------------------------------------------------
// S4 — IBAN selected (saved or new)
// ibanAction: 'saved' | 'new'
// ---------------------------------------------------------------------------
export async function postIbanSelected(session, iban, ibanAction, bankName) {
  if (USE_MOCK) return mockPost('S5_FINANCIAL_SUMMARY')
  const payload = { iban, iban_action: ibanAction }
  if (ibanAction === 'new' && bankName) payload.bank_name = bankName
  return post(
    {
      ...baseBody(session),
      action: 'IBAN_SELECTED',
      payload,
    },
    session.session_token,
  )
}

// ---------------------------------------------------------------------------
// S5 — Final submission confirmed
// ---------------------------------------------------------------------------
export async function postSubmitConfirmed(session, ibanOverride = null) {
  if (USE_MOCK) return mockPost('COMPLETED')
  return post(
    {
      ...baseBody(session),
      action: 'SUBMIT_CONFIRMED',
      payload: ibanOverride ? { iban: ibanOverride } : null,
    },
    session.session_token,
  )
}
