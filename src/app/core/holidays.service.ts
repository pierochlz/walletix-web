import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holiday } from './holidays';

// Second third-party service: Nager.Date (free, no key, CORS enabled) https://date.nager.at
// GET https://date.nager.at/api/v3/NextPublicHolidays/PE
//   -> [{ date: "2026-12-25", localName: "Navidad", name: "Christmas Day", ... }]
// Like the exchange rates, it is called from the browser: our token is never sent to it (see auth.interceptor.ts)
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private http = inject(HttpClient);

  upcoming(): Observable<Holiday[]> {
    return this.http
      .get<NagerHoliday[]>(environment.holidaysUrl)
      .pipe(map((list) => (list ?? []).map((h) => ({ date: h.date, localName: h.localName, name: h.name }))));
  }
}
