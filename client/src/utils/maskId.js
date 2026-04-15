/**
 * Masks a national ID number for public display.
 * Shows the first 2 digits, asterisks for the middle, and the last 3 digits.
 *
 * Examples:
 *   "35678890"  → "35***890"
 *   "123456789" → "12****789"
 *   "1234567"   → "12**567"
 *   "12345"     → "12345"  (too short to mask meaningfully)
 */
export function maskIdNumber(id) {
  const s = String(id).trim()
  if (s.length <= 5) return s
  const prefix = s.slice(0, 2)
  const suffix = s.slice(-3)
  const middleLength = Math.max(s.length - 5, 1)
  return `${prefix}${'*'.repeat(middleLength)}${suffix}`
}
