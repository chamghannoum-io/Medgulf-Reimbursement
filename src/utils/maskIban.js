/**
 * Masks an IBAN for display.
 * Shows first 2 chars + last 3 chars, rest as *.
 * e.g. "SA123456789012345678901" → "SA** **** **** **** ***901"
 */
export function maskIban(iban) {
  if (!iban || iban.length < 5) return iban

  const prefix = iban.slice(0, 2)
  const suffix = iban.slice(-3)
  const hidden = iban.slice(2, -3).replace(/./g, '*')

  // Group into blocks of 4 for readability
  const full = prefix + hidden + suffix
  return full.match(/.{1,4}/g)?.join(' ') ?? full
}
