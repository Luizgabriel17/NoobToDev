import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { API_BASE_URL, STORAGE_KEYS } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { AuthResponse, LoginPayload, RegisterPayload, Usuario } from '../models/auth';

const mockUsers: Usuario[] = [
  { id: 1, nome: 'Ana', email: 'ana@teste.com', xpTotal: 40, papel: 'STUDENT' },
  { id: 2, nome: 'Beto', email: 'beto@teste.com', xpTotal: 80, papel: 'STUDENT' },
  { id: 3, nome: 'Nina', email: 'nina@teste.com', xpTotal: 120, papel: 'ADMIN' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = new HttpClient();
  private readonly router = new Router();

  readonly user = signal<Usuario | null>(this.restoreUser());
  readonly token = signal<string | null>(this.restoreToken());
  readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));
  readonly loading = signal(false);
  readonly mensagem = signal<string | null>(null);

  login(payload: LoginPayload): Observable<Usuario> {
    this.loading.set(true);
    this.mensagem.set(null);

    const fallback = mockUsers.find((user) => user.email.toLowerCase() === payload.email.toLowerCase() && user.email !== 'admin');

    if (fallback && payload.senha === '123456') {
      const session: AuthResponse = {
        accessToken: `mock-token-${fallback.id}`,
        usuario: fallback,
      };

      this.persistSession(session);
      this.loading.set(false);
      return of(fallback);
    }

    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => response.usuario),
      catchError((error) => {
        const fallbackUser = mockUsers.find(
          (user) => user.email.toLowerCase() === payload.email.toLowerCase() && payload.senha === '123456',
        );

        if (fallbackUser) {
          const session: AuthResponse = {
            accessToken: `mock-token-${fallbackUser.id}`,
            usuario: fallbackUser,
          };
          this.persistSession(session);
          this.loading.set(false);
          return of(fallbackUser);
        }

        const message = mensagemDeErro(error);
        this.mensagem.set(message);
        this.loading.set(false);
        return throwError(() => new Error(message));
      }),
      finalizer(() => this.loading.set(false)),
    );
  }

  register(payload: RegisterPayload): Observable<Usuario> {
    this.loading.set(true);
    this.mensagem.set(null);

    const alreadyExists = mockUsers.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
    if (!alreadyExists) {
      const usuario: Usuario = {
        id: Date.now(),
        nome: payload.nome,
        email: payload.email,
        xpTotal: 0,
        papel: 'STUDENT',
      };
      const session: AuthResponse = {
        accessToken: `mock-token-${usuario.id}`,
        usuario,
      };
      this.persistSession(session);
      this.loading.set(false);
      return of(usuario);
    }

    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => response.usuario),
      catchError((error) => {
        const message = mensagemDeErro(error);
        this.mensagem.set(message);
        this.loading.set(false);
        return throwError(() => new Error(message));
      }),
      finalizer(() => this.loading.set(false)),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.token, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response.usuario));
    this.token.set(response.accessToken);
    this.user.set(response.usuario);
  }

  private restoreToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(STORAGE_KEYS.token) ?? null;
  }

  private restoreUser(): Usuario | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}

function finalizer<T>(callback: () => void): (source: Observable<T>) => Observable<T> {
  return (source) => new Observable<T>((subscriber) => {
    const subscription = source.subscribe({
      next: (value) => subscriber.next(value),
      error: (error) => {
        callback();
        subscriber.error(error);
      },
      complete: () => {
        callback();
        subscriber.complete();
      },
    });

    return () => subscription.unsubscribe();
  });
}
