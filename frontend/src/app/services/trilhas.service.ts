import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { Trilha } from '../models/trilha';

@Injectable({ providedIn: 'root' })
export class TrilhasService {
  private readonly http = inject(HttpClient);

  readonly trilhas = signal<Trilha[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  carregarTrilhas(): Observable<Trilha[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<Trilha[]>(`${API_BASE_URL}/trilhas`).pipe(
      tap((trilhas) => this.trilhas.set(trilhas)),
      catchError((error: unknown) => {
        this.trilhas.set([]);
        this.error.set(mensagemDeErro(error));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
