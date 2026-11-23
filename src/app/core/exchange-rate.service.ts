import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Third-party service: ExchangeRate-API (free, no key) https://www.exchangerate-api.com/docs/free
// GET https://open.er-api.com/v6/latest/PEN -> { result: "success", time_last_update_utc, rates: { USD: 0.27, ... } }
interface ExchangeRateResponse {
  result: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

export interface ExchangeRates {
  updatedAt: Date;
  rates: Record<string, number>; // how much of each currency 1 PEN buys
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private http = inject(HttpClient);

  latestFromPen(): Observable<ExchangeRates> {
    return this.http.get<ExchangeRateResponse>(environment.exchangeRatesUrl).pipe(
      map((response) => {
        if (response.result !== 'success') throw new Error('Exchange rate service error');
        return { updatedAt: new Date(response.time_last_update_utc), rates: response.rates };
      }),
    );
  }
}
