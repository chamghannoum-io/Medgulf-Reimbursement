/**
 * Client-side IBAN validation per business rules:
 *  - 24 characters
 *  - Alphanumeric only
 *  - Starts with a 2-letter country code
 */
export function validateIban(iban) {
  if (!iban) return { valid: false, error: 'iban.error.required' }

  const stripped = iban.replace(/\s/g, '')

  if (stripped.length !== 24) {
    return { valid: false, error: 'iban.error.length' }
  }

  if (!/^[A-Z]{2}[A-Z0-9]{22}$/.test(stripped)) {
    return { valid: false, error: 'iban.error.format' }
  }

  return { valid: true, error: null }
}
