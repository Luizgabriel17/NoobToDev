import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { API_BASE_URL } from '../core/api.config';
import { mensagemDeErro } from '../core/error.util';
import { Desafio, LicaoDetalhe, RespostaResultado } from '../models/licao';

const mockLicoes: Record<number, LicaoDetalhe> = {
  1: {
    id: 1,
    titulo: 'Estrutura básica',
    moduloTitulo: 'Introdução ao HTML',
    status: 'DISPONIVEL',
    desafios: [
      {
        id: 11,
        ordem: 1,
        tipo: 'ESCOLHA_UNICA',
        enunciado: 'Qual tag cria o título principal de uma página?',
        pontos: 10,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 101, texto: '<h1>', correta: true },
          { id: 102, texto: '<p>', correta: false },
          { id: 103, texto: '<main>', correta: false },
        ],
      },
      {
        id: 12,
        ordem: 2,
        tipo: 'ORDENACAO',
        enunciado: 'Organize a ordem correta da estrutura básica de uma página HTML.',
        pontos: 15,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 201, texto: '<html>', posicaoCorreta: 1 },
          { id: 202, texto: '<head>', posicaoCorreta: 2 },
          { id: 203, texto: '<body>', posicaoCorreta: 3 },
        ],
      },
      {
        id: 13,
        ordem: 3,
        tipo: 'ESCOLHA_UNICA',
        enunciado: 'Qual tag representa um parágrafo no HTML?',
        pontos: 10,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 301, texto: '<p>', correta: true },
          { id: 302, texto: '<img>', correta: false },
          { id: 303, texto: '<title>', correta: false },
        ],
      },
    ],
  },
  2: {
    id: 2,
    titulo: 'Textos: h1 e p',
    moduloTitulo: 'Introdução ao HTML',
    status: 'DISPONIVEL',
    desafios: [
      {
        id: 21,
        ordem: 1,
        tipo: 'ESCOLHA_UNICA',
        enunciado: 'Qual tag costuma ser usada para o texto principal de maior destaque?',
        pontos: 10,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 401, texto: '<h1>', correta: true },
          { id: 402, texto: '<span>', correta: false },
          { id: 403, texto: '<li>', correta: false },
        ],
      },
      {
        id: 22,
        ordem: 2,
        tipo: 'ORDENACAO',
        enunciado: 'Coloque a ordem correta da leitura de um texto em página HTML.',
        pontos: 15,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 501, texto: 'Título', posicaoCorreta: 1 },
          { id: 502, texto: 'Parágrafo', posicaoCorreta: 2 },
          { id: 503, texto: 'Subtítulo', posicaoCorreta: 3 },
        ],
      },
    ],
  },
  3: {
    id: 3,
    titulo: 'Listas e links',
    moduloTitulo: 'Introdução ao HTML',
    status: 'BLOQUEADA',
    desafios: [
      {
        id: 31,
        ordem: 1,
        tipo: 'ESCOLHA_UNICA',
        enunciado: 'Qual tag cria um link para outra página?',
        pontos: 10,
        conteudo: null,
        respondido: false,
        opcoes: [
          { id: 601, texto: '<a>', correta: true },
          { id: 602, texto: '<link>', correta: false },
          { id: 603, texto: '<button>', correta: false },
        ],
      },
    ],
  },
};

@Injectable({ providedIn: 'root' })
export class LicoesService {
  private readonly http = inject(HttpClient);

  readonly licaoAtual = signal<LicaoDetalhe | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  carregarLicao(id: number): Observable<LicaoDetalhe> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<LicaoDetalhe>(`${API_BASE_URL}/licoes/${id}`).pipe(
      tap((licao) => {
        this.licaoAtual.set(this.normalizarLicao(licao));
        this.loading.set(false);
      }),
      catchError((error) => {
        const fallback = mockLicoes[id] ?? this.criarLicaoFallback(id);
        this.licaoAtual.set(this.normalizarLicao(fallback));
        this.error.set(`${mensagemDeErro(error)} Mostrando dados de demonstração.`);
        this.loading.set(false);
        return of(this.normalizarLicao(fallback));
      }),
    );
  }

  verificarResposta(idDesafio: number, resposta: { opcaoId?: number; ordem?: number[] }): Observable<RespostaResultado> {
    const licao = this.licaoAtual();
    if (!licao) {
      return of({
        acertou: false,
        xpGanho: 0,
        explicacao: 'Lição não localizada.',
        respostaCorreta: {},
        xpTotal: 0,
        licao: null,
      });
    }

    const desafio = licao.desafios.find((item) => item.id === idDesafio);
    if (!desafio) {
      return of({
        acertou: false,
        xpGanho: 0,
        explicacao: 'Desafio não localizado.',
        respostaCorreta: {},
        xpTotal: 0,
        licao: null,
      });
    }

    const resultado = this.avaliarDesafio(desafio, resposta);
    const totalAcertos = licao.desafios.filter((item) => item.respondido).length + Number(resultado.acertou);
    const totalDesafios = licao.desafios.length;
    const ultimoDesafio = idDesafio === licao.desafios[licao.desafios.length - 1].id;

    if (ultimoDesafio) {
      return of({
        ...resultado,
        licao: {
          concluida: true,
          acertos: totalAcertos,
          total: totalDesafios,
          xpGanho: resultado.acertou ? desafio.pontos : 0,
          proximaLicaoId: 3,
        },
      });
    }

    return of(resultado);
  }

  private normalizarLicao(licao: LicaoDetalhe): LicaoDetalhe {
    return {
      ...licao,
      desafios: licao.desafios.map((desafio) => ({
        ...desafio,
        respondido: false,
        opcoes: desafio.opcoes.map((opcao) => ({
          ...opcao,
          correta: 'correta' in opcao ? opcao.correta : undefined,
        })),
      })),
    };
  }

  private criarLicaoFallback(id: number): LicaoDetalhe {
    return {
      id,
      titulo: `Lição ${id}`,
      moduloTitulo: 'Módulo',
      status: 'DISPONIVEL',
      desafios: [
        {
          id: id * 10 + 1,
          ordem: 1,
          tipo: 'ESCOLHA_UNICA',
          enunciado: 'Selecione a opção correta.',
          pontos: 10,
          conteudo: null,
          respondido: false,
          opcoes: [
            { id: id * 10 + 100, texto: 'Opção correta', correta: true },
            { id: id * 10 + 101, texto: 'Opção errada', correta: false },
          ],
        },
      ],
    };
  }

  private avaliarDesafio(desafio: Desafio, resposta: { opcaoId?: number; ordem?: number[] }): RespostaResultado {
    if (desafio.tipo === 'ESCOLHA_UNICA') {
      const correta = desafio.opcoes.find((opcao) => opcao.correta);
      const acertou = Number(resposta.opcaoId) === correta?.id;

      return {
        acertou,
        xpGanho: acertou ? desafio.pontos : 0,
        explicacao: acertou
          ? 'Resposta correta. Essa opção marca a estrutura esperada.'
          : `A resposta correta era ${correta?.texto ?? 'a opção correta'}.`,
        respostaCorreta: { opcaoId: correta?.id },
        xpTotal: 0,
        licao: null,
      };
    }

    const ordemCorreta = desafio.opcoes
      .slice()
      .sort((a, b) => Number(a.posicaoCorreta ?? 0) - Number(b.posicaoCorreta ?? 0))
      .map((opcao) => opcao.id);

    const acertou = Array.isArray(resposta.ordem) && JSON.stringify(resposta.ordem) === JSON.stringify(ordemCorreta);

    return {
      acertou,
      xpGanho: acertou ? desafio.pontos : 0,
      explicacao: acertou
        ? 'Sua ordem está correta. Esse encaixe segue a lógica da estrutura esperada.'
        : `A resposta correta era ${ordemCorreta.join(', ')}.`,
      respostaCorreta: { ordem: ordemCorreta },
      xpTotal: 0,
      licao: null,
    };
  }
}
