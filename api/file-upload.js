/**
 * Vercel Edge Function — proxies file uploads to the file service.
 * Strips the Origin/Referer headers so the upstream service doesn't
 * reject the request with "Invalid CORS request".
 */
export const config = { runtime: 'edge' }

const UPSTREAM = 'https://api.mg-test.iohealth.com/file-service/api/upload'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Forward the request body and Authorization header; drop Origin/Referer.
  const headers = new Headers()
  const auth = req.headers.get('authorization')
  if (auth) headers.set('authorization', auth)
  // content-type (multipart boundary) must be forwarded so the upstream can parse the form.
  const ct = req.headers.get('content-type')
  if (ct) headers.set('content-type', ct)

  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers,
    body: req.body,
    duplex: 'half',
  })

  const text = await upstream.text()
  return new Response(text, { status: upstream.status })
}
