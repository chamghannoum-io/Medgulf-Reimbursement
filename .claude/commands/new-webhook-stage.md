# New Webhook Stage

Add a new webhook stage function to `src/services/webhookService.js`.

## Instructions

The stage to add is: **$ARGUMENTS**

## Rules

All webhook functions must follow this exact pattern:

```js
/**
 * Stage N — {Description}
 * Called when: {describe the trigger}
 * n8n node: {Wait node name in n8n}
 */
export async function post{StageName}(url, payload) {
  const session = getSession() // from SessionContext — import the getter

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.session_token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000), // 30s timeout
  })

  if (!response.ok) {
    const err = new Error(`Webhook failed: ${response.status}`)
    err.stage = '{stageName}'
    err.status = response.status
    throw err
  }

  const data = await response.json()

  // Always extract and return resumeUrl — callers depend on this
  return {
    type: data[0]?.type || data.type,
    message: data[0]?.message || data.message,
    data: data[0] || data,
    resumeUrl: data[0]?.resumeUrl || data.resumeUrl || null,
  }
}
```

## Checklist after adding the function
1. The function is exported and named `post{StageName}`
2. `Authorization` header always included — session_token never in URL
3. 30-second timeout via `AbortSignal.timeout(30000)`
4. Returns `{ type, message, data, resumeUrl }` — always, even if resumeUrl is null
5. Throws a typed error (with `.stage` property) on non-2xx
6. Add the function call to the appropriate place in `useClaimFlow.js`
7. Add a mock response fixture to `src/mock/n8n/{stage}-response.json`

## Reference
See `.claude/docs/webhook-payloads.md` for the exact request/response shape for all 4 stages.
