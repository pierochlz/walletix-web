import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('adds the Bearer token to requests to the Walletix API', () => {
    auth.token.set('abc.def.ghi');
    http.get(`${environment.apiUrl}/gastos`).subscribe();
    const request = httpMock.expectOne(`${environment.apiUrl}/gastos`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    request.flush([]);
  });

  it('never sends the token to third-party services', () => {
    auth.token.set('abc.def.ghi');
    http.get(environment.exchangeRatesUrl).subscribe();
    const request = httpMock.expectOne(environment.exchangeRatesUrl);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
