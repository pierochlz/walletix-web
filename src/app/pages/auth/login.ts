import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    AuthShell,
  ],
  template: `
    <app-auth-shell>
      <mat-card appearance="outlined" class="auth-card">
        <mat-card-header>
          <mat-card-title><h1>{{ 'login.title' | t }}</h1></mat-card-title>
          <mat-card-subtitle>{{ 'login.subtitle' | t }}</mat-card-subtitle>
        </mat-card-header>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <mat-card-content>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'login.email' | t }}</mat-label>
              <input matInput type="email" formControlName="correo" autocomplete="email" required />
              <mat-icon matPrefix aria-hidden="true">mail</mat-icon>
              <mat-error>{{ (form.controls.correo.hasError('email') ? 'form.email' : 'form.required') | t }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'login.password' | t }}</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="contrasena"
                     autocomplete="current-password" required />
              <mat-icon matPrefix aria-hidden="true">lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())"
                      [attr.aria-label]="(showPassword() ? 'login.hidePassword' : 'login.showPassword') | t"
                      [attr.aria-pressed]="showPassword()">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>{{ 'form.required' | t }}</mat-error>
            </mat-form-field>

            @if (error()) {
              <p class="api-error" role="alert">{{ error() }}</p>
            }
          </mat-card-content>

          @if (loading()) {
            <mat-progress-bar mode="indeterminate" [attr.aria-label]="'app.loading' | t" />
          }

          <mat-card-actions>
            <button mat-flat-button type="submit" class="full" [disabled]="loading()">{{ 'login.submit' | t }}</button>
          </mat-card-actions>
        </form>

        <p class="switch">
          {{ 'login.noAccount' | t }} <a routerLink="/register">{{ 'login.register' | t }}</a>
        </p>
      </mat-card>
    </app-auth-shell>
  `,
  styleUrl: './auth.css',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private i18n = inject(I18nService);

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    // POST /login -> { token }; the AuthService saves the token
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.i18n.t(err.status === 0 ? 'app.connectionError' : 'login.error'));
      },
    });
  }
}
