/**
 * Reads the `dateFormat` preference from localStorage and returns
 * a formatted date string for the given ISO date string.
 * Defaults to 'medium' if no preference is set.
 */
export function formatHearingDate(isoDate: string): string {
  let style: 'short' | 'medium' | 'long' = 'medium';
  try {
    const prefs = JSON.parse(localStorage.getItem('vakildesk_prefs') || '{}');
    if (prefs.dateFormat === 'short' || prefs.dateFormat === 'long') {
      style = prefs.dateFormat;
    }
  } catch { /* use default */ }

  return new Date(isoDate).toLocaleDateString('en-IN', { dateStyle: style });
}

/** Returns today's date string in YYYY-MM-DD format (for input min attribute) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
