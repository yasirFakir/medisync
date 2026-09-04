/**
 * Normalizes and formats doctor names to ensure consistent and correct "Dr. [Name]" presentation
 * without duplicate prefixes like "Dr. Dr. Arif Hossain" or "Dr. Prescriber".
 */
export const formatDoctorName = (name?: string | null, fallback = 'Prescriber'): string => {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === 'prescriber' || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'doctor') {
    return fallback;
  }
  // Strip any leading repeated variations of "dr.", "dr", "doctor" (case-insensitive)
  const cleanName = trimmed.replace(/^(?:(?:dr\.|dr|doctor)\s*)+/i, '').trim();
  return cleanName ? `Dr. ${cleanName}` : fallback;
};
