import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  Observable,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { API_BASE_URL, STORAGE_KEYS } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import {
  AuthResponse,
  LoginPayload,
  PapelUsuario,
  RegisterPayload,
  Usuario,
} from '../models/auth';

function isUsuario(value: unknown): value is Usuario {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const usuario = value as Partial<Usuario>;
  return (
    typeof usuario.id === 'number' &&
    typeof usuario.nome === 'string' &&
    typeof usuario.email === 'string' &&
    typeof usuario.xpTotal === 'number' &&
    (usuario.papel === 'ESTUDANTE' || usuario.papel === 'ADMIN')
  );
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<Usuario | null>(this.restoreUser());
  readonly token = signal<string | null>(this.restoreToken());
  readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));
  readonly loading = signal(false);
  readonly mensagem = signal<string | null>(null);

  login(payload: LoginPayload): Observable<Usuario> {
    this.loading.set(true);
    this.mensagem.set(null);

    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload)
      .pipe(
        tap((response) => this.persistSession(response)),
        map((response) => response.usuario),
        catchError((error: unknown) => this.handleAuthError(error)),
        finalize(() => this.loading.set(false)),
      );
  }

  register(payload: RegisterPayload): Observable<Usuario> {
    this.loading.set(true);
    this.mensagem.set(null);

    return this.http
      .post<Usuario>(`${API_BASE_URL}/auth/register`, payload)
      .pipe(
        switchMap(() =>
          this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
            email: payload.email,
            senha: payload.senha,
          }),
        ),
        tap((response) => this.persistSession(response)),
        map((response) => response.usuario),
        catchError((error: unknown) => this.handleAuthError(error)),
        finalize(() => this.loading.set(false)),
      );
  }

  updateXpTotal(xpTotal: number): void {
    this.user.update((usuario) => (usuario ? { ...usuario, xpTotal } : usuario));
    const usuario = this.user();
    if (usuario && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(usuario));
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.token);
      window.localStorage.removeItem(STORAGE_KEYS.user);
    }
    this.token.set(null);
    this.user.set(null);
    void this.router.navigate(['/login']);
  }

  private persistSession(response: AuthResponse): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.token, response.accessToken);
      window.localStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify(response.usuario),
      );
    }
    this.token.set(response.accessToken);
    this.user.set(response.usuario);
  }

  private restoreToken(): string | null {
    return typeof window === 'undefined'
      ? null
      : (window.localStorage.getItem(STORAGE_KEYS.token) ?? null);
  }

  private restoreUser(): Usuario | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storage = window.localStorage;
    const raw = storage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }

    try {
      const usuario: unknown = JSON.parse(raw);
      if (isUsuario(usuario)) {
        return usuario;
      }
    } catch {
      storage.removeItem(STORAGE_KEYS.user);
      storage.removeItem(STORAGE_KEYS.token);
      return null;
    }

    storage.removeItem(STORAGE_KEYS.user);
    storage.removeItem(STORAGE_KEYS.token);
    return null;
  }

  private handleAuthError(error: unknown): Observable<never> {
    this.mensagem.set(mensagemDeErro(error));
    return throwError(() => error);
  }
}
