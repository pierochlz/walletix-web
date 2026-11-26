import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { NotificationStore } from './notification.store';

describe('notification preferences (US25)', () => {
  it('reads and saves which notifications the user wants to receive', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const store = TestBed.inject(NotificationStore);
    const http = TestBed.inject(HttpTestingController);
    const url = `${environment.apiUrl}/notificaciones/preferencias`;

    let read: unknown;
    store.preferences().subscribe((p) => (read = p));
    const get = http.expectOne(url);
    expect(get.request.method).toBe('GET');
    get.flush({ alerta: true, logro: true, reto: true });
    expect(read).toEqual({ alerta: true, logro: true, reto: true });

    store.savePreferences({ alerta: false, logro: true, reto: false }).subscribe();
    const put = http.expectOne(url);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ alerta: false, logro: true, reto: false });
    put.flush(put.request.body);
    http.verify();
  });
});
