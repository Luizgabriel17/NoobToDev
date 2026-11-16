import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { PerfilUsuario } from '../models/perfil';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);

  readonly perfil = signal<PerfilUsuario | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  carregarPerfil(): Observable<PerfilUsuario> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<PerfilUsuario>(`${API_BASE_URL}/perfil`).pipe(
      tap((perfil) => this.perfil.set(perfil)),
      catchError((error: unknown) => {
        this.perfil.set(null);
        this.error.set(mensagemDeErro(error));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
