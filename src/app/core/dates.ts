// Today's date as "yyyy-MM-dd" in the user's time zone.
// toISOString() uses UTC: in Peru (UTC-5), from 7 p.m. it already returns tomorrow's date,
// and the API (which uses Peru's time) would reject an expense "dated in the future".
export function localToday(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Current month as "yyyy-MM" in the user's time zone
export function localMonth(date: Date = new Date()): string {
  return localToday(date).slice(0, 7);
}
