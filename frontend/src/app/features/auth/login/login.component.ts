import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['ana@teste.com', [Validators.required, Validators.email]],
    senha: ['123456', [Validators.required]],
  });

  readonly loading = this.authService.loading;
  readonly errorMessage = this.authService.mensagem;
  readonly isFormValid = computed(() => this.form.valid);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.authService.login(payload).subscribe({
      next: () => this.router.navigate(['/trilha']),
      error: () => undefined,
    });
  }
}
