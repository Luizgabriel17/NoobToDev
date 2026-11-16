import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { PerfilUsuario } from '../models/perfil';

const mockPerfil: PerfilUsuario = {
  id: 1,
  nome: 'Ana',
  email: 'ana@teste.com',
  xpTotal: 40,
  licoesConcluidas: 1,
  totalLicoes: 5,
  criadoEm: '2026-11-15T12:00:00.000Z',
  trilhas: [
    { id: 1, titulo: 'Fundamentos de Desenvolvimento Web', concluidas: 1, total: 5, percentual: 20 },
    { id: 2, titulo: 'Estilizando páginas', concluidas: 0, total: 3, percentual: 0 },
  ],
};

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = new HttpClient();

  readonly perfil = signal<PerfilUsuario | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  carregarPerfil(): Observable<PerfilUsuario> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<PerfilUsuario>(`${API_BASE_URL}/perfil`).pipe(
      tap((perfil) => {
        this.perfil.set(perfil);
        this.loading.set(false);
      }),
      catchError((error) => {
        const message = mensagemDeErro(error);
        this.perfil.set(mockPerfil);
        this.error.set(`${message} Mostrando dados de demonstração.`);
        this.loading.set(false);
        return of(mockPerfil);
      }),
    );
  }
}
