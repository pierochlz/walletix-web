// Upcoming public holidays in Peru (second third-party API: Nager.Date). Pure logic, without Angular.
// A long weekend usually means more spending (trips, outings), so the dashboard reminds the user to plan it.

export interface Holiday {
  date: string; // "yyyy-MM-dd"
  localName: string; // Spanish name ("Navidad")
  name: string; // English name ("Christmas Day")
}

// The next `count` holidays from today (included), in date order
export function upcomingHolidays(list: Holiday[], today: string, count = 3): Holiday[] {
  return list
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
}

// Whole days between today and the holiday (0 = today), without time zone problems
export function daysUntil(date: string, today: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((toUtc(date) - toUtc(today)) / 86_400_000);
}

// i18n key and params for "today", "tomorrow" or "in 12 days"
export function whenLabel(days: number): { key: string; params?: Record<string, number> } {
  if (days <= 0) return { key: 'holidays.today' };
  if (days === 1) return { key: 'holidays.tomorrow' };
  return { key: 'holidays.inDays', params: { days } };
}
