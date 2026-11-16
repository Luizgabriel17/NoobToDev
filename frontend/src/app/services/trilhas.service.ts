import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { Trilha } from '../models/trilha';

const mockTrilhas: Trilha[] = [
  {
    id: 1,
    titulo: 'Fundamentos de Desenvolvimento Web',
    linguagem: { id: 1, nome: 'HTML e CSS', slug: 'html-css' },
    progresso: { concluidas: 1, total: 5, percentual: 20 },
    modulos: [
      {
        id: 1,
        titulo: 'Introdução ao HTML',
        ordem: 1,
        licoes: [
          { id: 1, titulo: 'Estrutura básica', ordem: 1, status: 'CONCLUIDA', xpGanho: 30 },
          { id: 2, titulo: 'Textos: h1 e p', ordem: 2, status: 'DISPONIVEL', xpGanho: 0 },
          { id: 3, titulo: 'Listas e links', ordem: 3, status: 'BLOQUEADA', xpGanho: 0 },
        ],
      },
    ],
  },
  {
    id: 2,
    titulo: 'Estilizando páginas',
    linguagem: { id: 2, nome: 'CSS', slug: 'css' },
    progresso: { concluidas: 0, total: 3, percentual: 0 },
    modulos: [
      {
        id: 2,
        titulo: 'Seletores e box model',
        ordem: 1,
        licoes: [
          { id: 4, titulo: 'Seletores básicos', ordem: 1, status: 'DISPONIVEL', xpGanho: 0 },
          { id: 5, titulo: 'Margens, paddings e borders', ordem: 2, status: 'BLOQUEADA', xpGanho: 0 },
        ],
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class TrilhasService {
  private readonly http = new HttpClient();

  readonly trilhas = signal<Trilha[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  carregarTrilhas(): Observable<Trilha[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<Trilha[]>(`${API_BASE_URL}/trilhas`).pipe(
      tap((trilhas) => {
        this.trilhas.set(trilhas);
        this.loading.set(false);
      }),
      catchError((error) => {
        const message = mensagemDeErro(error);
        this.trilhas.set(mockTrilhas);
        this.error.set(`${message} Mostrando dados de demonstração.`);
        this.loading.set(false);
        return of(mockTrilhas);
      }),
    );
  }
}
