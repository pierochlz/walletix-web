import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { daysUntil, Holiday, upcomingHolidays, whenLabel } from './holidays';
import { HolidayService } from './holidays.service';

const list: Holiday[] = [
  { date: '2027-01-01', localName: 'Año Nuevo', name: "New Year's Day" },
  { date: '2026-12-08', localName: 'Inmaculada Concepción', name: 'Immaculate Conception' },
  { date: '2026-11-01', localName: 'Todos los Santos', name: "All Saints' Day" },
  { date: '2026-12-25', localName: 'Navidad', name: 'Christmas Day' },
  { date: '2026-12-09', localName: 'Batalla de Ayacucho', name: 'Battle of Ayacucho' },
];

describe('holidays (second third-party API: Nager.Date)', () => {
  it('keeps the next ones from today, in date order', () => {
    expect(upcomingHolidays(list, '2026-11-27').map((h) => h.date)).toEqual(['2026-12-08', '2026-12-09', '2026-12-25']);
    expect(upcomingHolidays(list, '2026-12-25', 5).map((h) => h.localName)).toEqual(['Navidad', 'Año Nuevo']); // today counts
    expect(upcomingHolidays([], '2026-11-27')).toEqual([]);
  });

  it('counts whole days, also across months and years', () => {
    expect(daysUntil('2026-12-08', '2026-11-27')).toBe(11);
    expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1);
    expect(daysUntil('2026-11-27', '2026-11-27')).toBe(0);
  });

  it('says today, tomorrow or in N days', () => {
    expect(whenLabel(0)).toEqual({ key: 'holidays.today' });
    expect(whenLabel(1)).toEqual({ key: 'holidays.tomorrow' });
    expect(whenLabel(11)).toEqual({ key: 'holidays.inDays', params: { days: 11 } });
  });

  it('reads the Nager.Date response and never sends our token to it', () => {
    // With the real interceptor and a logged-in user: the token must only go to our API
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).token.set('token-de-prueba');
    const http = TestBed.inject(HttpTestingController);
    let result: Holiday[] = [];
    TestBed.inject(HolidayService).upcoming().subscribe((r) => (result = r));
    const req = http.expectOne(environment.holidaysUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([{ date: '2026-12-25', localName: 'Navidad', name: 'Christmas Day', countryCode: 'PE', global: true }]);
    expect(result).toEqual([{ date: '2026-12-25', localName: 'Navidad', name: 'Christmas Day' }]);
    http.verify();
  });
});
