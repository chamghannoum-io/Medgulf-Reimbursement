const BASE_URL = import.meta.env.VITE_WEBHOOK_BASE_URL
const INITIAL_PATH = import.meta.env.VITE_INITIAL_WEBHOOK_PATH
const TIMEOUT_MS = 30_000
const OCR_TIMEOUT_MS = 300_000 // OCR can take up to 5 minutes
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'

// ---------------------------------------------------------------------------
// Mock mode — maps resumeUrl patterns → fixture files
// When VITE_USE_MOCK=true, no real HTTP calls are made.
// ---------------------------------------------------------------------------
const MOCK_RESUME_MAP = {
  'mock-stage0b-benefit':  () => import('../mock/n8n/stage0b-document-upload.json'),
  'mock-stage1-ocr':       () => import('../mock/n8n/stage1-processing-steps.json'),
  'mock-stage1-uuid':      () => import('../mock/n8n/stage1-success.json'),
  'mock-resume-stage2':    () => import('../mock/n8n/stage2-iban-input.json'),
  'mock-stage2-uuid':      () => import('../mock/n8n/stage2-iban-input.json'),
  'mock-warning-uuid':     () => import('../mock/n8n/stage2-iban-input.json'),
  'mock-iban-failed-uuid': () => import('../mock/n8n/stage2-iban-input-failed.json'),
  'mock-resume-stage3':    () => import('../mock/n8n/stage2-iban-input.json'),
  'mock-stage3-uuid':      () => import('../mock/n8n/stage3-financial-summary.json'),
  'mock-resume-stage4':    () => import('../mock/n8n/stage3-financial-summary.json'),
  'mock-stage4-uuid':      () => import('../mock/n8n/stage4-success.json'),
  'mock-resume-stage4b':   () => import('../mock/n8n/stage4-success.json'),
  'mock-resume-stage3b':   () => import('../mock/n8n/stage2-iban-input.json'),
  'mock-resume-claimant':  () => import('../mock/n8n/stage1-processing-steps.json'),
  'mock-claimant-uuid':    () => import('../mock/n8n/stage1-processing-steps.json'),
}

const MOCK_STAGE0_FIXTURE = () => import('../mock/n8n/stage0-benefit-type-selector.json')

function normalisedResponse(raw) {
  const data = Array.isArray(raw) ? raw[0] : raw
  // Accept common casing/naming variants that n8n workflows may use
  const resumeUrl =
    data.resumeUrl ??
    data.resume_url ??
    data.resumeWebhookUrl ??
    data.webhookUrl ??
    null
  console.log('[webhookService] response type:', data.type, '| resumeUrl:', resumeUrl)
  return { data, resumeUrl }
}

async function mockPost(resumeUrl) {
  await new Promise((r) => setTimeout(r, 800))
  const key = Object.keys(MOCK_RESUME_MAP).find((k) => resumeUrl?.includes(k))
  if (!key) throw new Error(`[mock] No fixture mapped for resumeUrl: ${resumeUrl}`)
  const mod = await MOCK_RESUME_MAP[key]()
  return normalisedResponse(mod.default)
}

// ---------------------------------------------------------------------------
// Real HTTP helpers
// ---------------------------------------------------------------------------
function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

async function post(url, body, token) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

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
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      const timeout = new Error('Request timed out')
      timeout.code = 'TIMEOUT'
      throw timeout
    }
    throw err
  }

  clearTimeout(timer)

  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  const raw = await res.json()
  return normalisedResponse(raw)
}

async function postForm(url, formData, token, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      // No Content-Type header — browser sets multipart boundary automatically
      headers: authHeader(token),
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      const timeout = new Error('Request timed out')
      timeout.code = 'TIMEOUT'
      throw timeout
    }
    throw err
  }

  clearTimeout(timer)

  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  const raw = await res.json()
  return normalisedResponse(raw)
}

// ---------------------------------------------------------------------------
// User text message — resumes an existing Wait node if resumeUrl is known,
// otherwise starts a new execution at the initial webhook.
// ---------------------------------------------------------------------------
export async function postUserMessage(session, message, resumeUrl) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    const mod = await MOCK_STAGE0_FIXTURE()
    return normalisedResponse(mod.default)
  }

  if (resumeUrl) {
    try {
      return await post(resumeUrl, { message }, session.session_token)
    } catch (err) {
      // 409 = execution already finished — fall through to start a fresh one
      if (err.status !== 409) throw err
    }
  }

  // No active execution (or stale resumeUrl) — start a new one
  const url = `${BASE_URL}${INITIAL_PATH}`
  const body = {
    session_id: session.session_id,
    user_id: session.user_id,
    policy_number: session.policy_number,
    language: session.language,
    message,
  }
  return post(url, body, session.session_token)
}

// ---------------------------------------------------------------------------
// Stage 0b — Benefit Type Selection (resumes execution → returns document_upload)
// ---------------------------------------------------------------------------
export async function postBenefitType(resumeUrl, data, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  const { benefit_type, for_dependent_id, for_dependent_name } = typeof data === 'string' ? { benefit_type: data } : data
  return post(resumeUrl, { benefit_type, for_dependent_id, for_dependent_name }, token)
}

// ---------------------------------------------------------------------------
// Stage 1 — Binary Document Upload (multipart/form-data → OCR → extracted_form)
// ---------------------------------------------------------------------------
export async function postDocumentUpload(resumeUrl, files, documentTypes, benefitType, claimNotes, token) {
  if (USE_MOCK) return mockPost(resumeUrl)

  const formData = new FormData()
  formData.append('benefit_type', benefitType || '')
  formData.append('claim_notes', claimNotes || '')

  files.forEach((file, index) => {
    formData.append('document', file, file.name)
    formData.append(`document_type_${index}`, documentTypes[index] || 'unknown')
    formData.append(`document_filename_${index}`, file.name)
    formData.append(`document_mimetype_${index}`, file.type || 'application/octet-stream')
    formData.append(`document_size_${index}`, String(file.size))
  })

  return postForm(resumeUrl, formData, token, OCR_TIMEOUT_MS)
}

// ---------------------------------------------------------------------------
// Stage 2 — Form Confirmation
// ---------------------------------------------------------------------------
export async function postFormConfirmation(resumeUrl, formData, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, formData, token)
}

// ---------------------------------------------------------------------------
// Claimant Selection (between Stage 1 and OCR if ambiguous)
// ---------------------------------------------------------------------------
export async function postClaimantSelection(resumeUrl, selectedClaimantId, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, { selected_claimant_id: selectedClaimantId }, token)
}

// ---------------------------------------------------------------------------
// Processing Steps completion (advance n8n after client animation)
// ---------------------------------------------------------------------------
export async function postProcessingComplete(resumeUrl, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, {}, token)
}

// ---------------------------------------------------------------------------
// Warning Banner — acknowledge flags and proceed or discard (resumes Stage 2)
// ---------------------------------------------------------------------------
export async function postWarningAction(resumeUrl, proceedAction, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, { proceed_action: proceedAction }, token)
}

// ---------------------------------------------------------------------------
// Stage 3 — IBAN Confirmation
// ---------------------------------------------------------------------------
export async function postIbanConfirmation(resumeUrl, ibanData, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, ibanData, token)
}

// ---------------------------------------------------------------------------
// Stage 4 — Final Submission
// ---------------------------------------------------------------------------
export async function postFinalSubmission(resumeUrl, submitAction, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  const body = {
    submit_action: submitAction,
    submission_timestamp: new Date().toISOString(),
  }
  return post(resumeUrl, body, token)
}

// ---------------------------------------------------------------------------
// Draft Save (any stage)
// ---------------------------------------------------------------------------
export async function postSaveDraft(resumeUrl, draftState, token) {
  if (USE_MOCK) return mockPost(resumeUrl)
  return post(resumeUrl, { action: 'save_draft', draft_state: draftState }, token)
}
