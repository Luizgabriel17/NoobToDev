import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  tap,
} from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { LicaoDetalhe, RespostaResultado } from '../models/licao';

export interface RespostaDesafio {
  opcaoId?: number;
  ordem?: number[];
}

@Injectable({ providedIn: 'root' })
export class LicoesService {
  private readonly http = inject(HttpClient);

  readonly licaoAtual = signal<LicaoDetalhe | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  carregarLicao(id: number): Observable<LicaoDetalhe> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .get<LicaoDetalhe>(`${API_BASE_URL}/licoes/${id}`)
      .pipe(
        tap((licao) => this.licaoAtual.set(licao)),
        catchError((error: unknown) => {
          this.licaoAtual.set(null);
          this.error.set(mensagemDeErro(error));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  verificarResposta(
    idDesafio: number,
    resposta: RespostaDesafio,
  ): Observable<RespostaResultado> {
    this.submitting.set(true);
    this.error.set(null);

    return this.http
      .post<RespostaResultado>(
        `${API_BASE_URL}/desafios/${idDesafio}/respostas`,
        resposta,
      )
      .pipe(
        tap((resultado) => {
          this.licaoAtual.update((licao) =>
            licao
              ? {
                  ...licao,
                  status: resultado.licao?.concluida
                    ? 'CONCLUIDA'
                    : licao.status,
                  desafios: licao.desafios.map((desafio) =>
                    desafio.id === idDesafio
                      ? { ...desafio, respondido: true }
                      : desafio,
                  ),
                }
              : licao,
          );
        }),
        catchError((error: unknown) => {
          this.error.set(mensagemDeErro(error));
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false)),
      );
  }
}
