import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, User } from './models';

const TOKEN_KEY = 'walletix_token';

// Handles the session: login, register, logout and the logged-in user
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = environment.apiUrl;

  // Signals: the components that read them update by themselves when they change
  readonly token = signal<string | null>(this.readToken());
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly roles = computed(() => this.rolesFromToken(this.token()));
  readonly isAdmin = computed(() => this.roles().includes('ADMIN'));

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        this.token.set(response.token);
      }),
    );
  }

  register(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.api}/usuarios/web`, user);
  }

  // GET /usuarios/yo: the API finds the user by the email inside the token
  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.api}/usuarios/yo`).pipe(tap((user) => this.user.set(user)));
  }

  updateProfile(user: Partial<User>): Observable<string> {
    return this.http.put(`${this.api}/usuarios/actualiza`, user, { responseType: 'text' });
  }

  changePassword(contrasenaActual: string, contrasenaNueva: string): Observable<string> {
    return this.http.put(
      `${this.api}/usuarios/contrasena`,
      { contrasenaActual, contrasenaNueva },
      { responseType: 'text' },
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  private readToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    // If the token already expired, it is discarded
    const payload = this.decode(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  }

  // The JWT payload is Base64URL JSON: { sub: email, roles: "USUARIO", exp: ... }
  private decode(token: string): any {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  private rolesFromToken(token: string | null): string[] {
    if (!token) return [];
    const payload = this.decode(token);
    // JwtTokenUtil saves the roles joined with commas: "ADMIN,USUARIO"
    const roles: string = payload?.roles ?? '';
    return roles.split(',').map((r) => r.trim()).filter((r) => r !== '');
  }
}
