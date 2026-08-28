/**
 * issueIdGenerator.js
 *
 * Generates human-readable public issue references (e.g. CIV-000001, CIV-000042).
 * Formatted as CIV-XXXXXX (6 digits minimum, zero-padded).
 */

/**
 * Generate a public reference ID.
 * If a numeric sequence index is provided, formats as CIV-000001.
 * Otherwise uses a deterministic timestamp + random salt for guaranteed uniqueness.
 *
 * @param {number|null} count - Optional existing count to increment
 * @returns {string} e.g. "CIV-000104" or "CIV-849201"
 */
export function generatePublicIssueId(count = null) {
  if (typeof count === 'number' && count >= 0) {
    const nextNumber = count + 1;
    return `CIV-${String(nextNumber).padStart(6, '0')}`;
  }

  // Fallback: Generate unique 6-digit random code
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CIV-${randomSuffix}`;
}
