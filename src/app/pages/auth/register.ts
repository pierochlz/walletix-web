import { localToday } from '../../core/dates';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressBarModule,
    TranslatePipe,
    AuthShell,
  ],
  templateUrl: './register.html',
  styleUrl: './auth.css',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly segments = ['estudiante', 'trabajador', 'independiente'];
  readonly today = localToday();

  // Same rules that UsuarioController.validar() checks in the API
  readonly form = this.fb.nonNullable.group({
    nombreUsuario: ['', [Validators.required, Validators.maxLength(50)]],
    correoUsuario: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
    contrasenaUsuario: ['', [Validators.required, Validators.minLength(6)]],
    telefonoUsuario: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    fechaNacimientoUsuario: ['', Validators.required],
    segmentoUsuario: ['', Validators.required],
    saldoActualUsuario: [0, [Validators.required, Validators.min(0)]],
    acceptTerms: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { acceptTerms, telefonoUsuario, ...data } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.register({ ...data, telefonoUsuario: Number(telefonoUsuario) }).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('register.success'), 'OK', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, this.i18n.t(err.status === 0 ? 'app.connectionError' : 'form.error')));
      },
    });
  }
}
