import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

// Security tests of the frontend session handling
describe('Frontend session security', () => {
  const runGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  // Builds a fake JWT (the frontend only reads the payload; the API checks the signature)
  const fakeToken = (payload: object) =>
    `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.signature`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'login', children: [] }]), provideHttpClient()],
    });
  });

  it('a visitor without session is sent to /login', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBe(true);
    expect(String(result)).toBe('/login');
  });

  it('a logged-in user can enter the private pages', () => {
    TestBed.inject(AuthService).token.set(fakeToken({ sub: 'a@b.com', roles: 'USUARIO' }));
    expect(runGuard()).toBe(true);
  });

  it('an expired token saved in the browser is discarded on startup', () => {
    const expired = fakeToken({ sub: 'a@b.com', roles: 'USUARIO', exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem('walletix_token', expired);
    const auth = TestBed.inject(AuthService);
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('walletix_token')).toBeNull();
  });

  it('reads the roles from the token: USUARIO is not ADMIN', () => {
    const auth = TestBed.inject(AuthService);
    auth.token.set(fakeToken({ sub: 'a@b.com', roles: 'USUARIO' }));
    expect(auth.isAdmin()).toBe(false);
    auth.token.set(fakeToken({ sub: 'a@b.com', roles: 'ADMIN,USUARIO' }));
    expect(auth.isAdmin()).toBe(true);
  });

  it('logout deletes the token from the browser', () => {
    const auth = TestBed.inject(AuthService);
    localStorage.setItem('walletix_token', 'abc');
    auth.token.set('abc');
    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('walletix_token')).toBeNull();
  });
});
