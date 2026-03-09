/**
 * Formats a numeric amount with a currency code.
 * Always uses Western Arabic numerals (0-9).
 * e.g. formatCurrency(1250, 'SAR') → '1,250 SAR'
 */
export function formatCurrency(amount, currencyCode = 'SAR') {
  if (amount === null || amount === undefined) return `— ${currencyCode}`
  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currencyCode}`
}
