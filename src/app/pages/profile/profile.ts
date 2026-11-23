import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

// Edit my data (PUT /usuarios/actualiza) and change my password (PUT /usuarios/contrasena)
@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private i18n = inject(I18nService);

  readonly segments = ['estudiante', 'trabajador', 'independiente'];
  readonly today = new Date().toISOString().slice(0, 10);
  readonly profileError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombreUsuario: ['', [Validators.required, Validators.maxLength(50)]],
    correoUsuario: ['', [Validators.required, Validators.email]],
    telefonoUsuario: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    fechaNacimientoUsuario: ['', Validators.required],
    segmentoUsuario: ['', Validators.required],
    saldoActualUsuario: [0, [Validators.required, Validators.min(0)]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    contrasenaActual: ['', Validators.required],
    contrasenaNueva: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // When the user arrives from GET /usuarios/yo, the form is filled with their data
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.form.patchValue({ ...user, telefonoUsuario: String(user.telefonoUsuario) });
      }
    });
  }

  saveProfile(): void {
    const user = this.auth.user();
    if (this.form.invalid || !user) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const body = { ...user, ...values, telefonoUsuario: Number(values.telefonoUsuario) };
    this.profileError.set(null);
    this.auth
      .updateProfile(body)
      .pipe(switchMap(() => this.auth.loadCurrentUser())) // reload my data from the API
      .subscribe({
        next: () => this.snackBar.open(this.i18n.t('form.saved'), 'OK', { duration: 3000 }),
        error: (err) => this.profileError.set(apiErrorMessage(err, this.i18n.t('form.error'))),
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { contrasenaActual, contrasenaNueva } = this.passwordForm.getRawValue();
    this.passwordError.set(null);
    this.auth.changePassword(contrasenaActual, contrasenaNueva).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open(this.i18n.t('form.saved'), 'OK', { duration: 3000 });
      },
      error: (err) => this.passwordError.set(apiErrorMessage(err, this.i18n.t('form.error'))),
    });
  }
}
