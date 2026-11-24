import { localMonth, localToday } from './dates';

describe('local dates', () => {
  it('uses the local day, not the UTC day', () => {
    // 23 Nov 2026 at 9:30 p.m. local time (in UTC it may already be the 24th)
    const night = new Date(2026, 10, 23, 21, 30);
    expect(localToday(night)).toBe('2026-11-23');
    expect(localMonth(night)).toBe('2026-11');
  });

  it('pads month and day with a zero', () => {
    expect(localToday(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
