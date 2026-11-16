export type TipoDesafio = 'ESCOLHA_UNICA' | 'ORDENACAO';

export interface OpcaoDesafio {
  id: number;
  texto: string;
  correta?: boolean;
  posicaoCorreta?: number;
}

export interface Desafio {
  id: number;
  ordem: number;
  tipo: TipoDesafio;
  enunciado: string;
  pontos: number;
  conteudo: string | null;
  respondido: boolean;
  opcoes: OpcaoDesafio[];
}

export interface LicaoDetalhe {
  id: number;
  titulo: string;
  moduloTitulo: string;
  status: 'CONCLUIDA' | 'DISPONIVEL' | 'BLOQUEADA';
  desafios: Desafio[];
}

export interface RespostaCorreta {
  opcaoId?: number;
  ordem?: number[];
}

export interface RespostaResultado {
  acertou: boolean;
  xpGanho: number;
  explicacao: string;
  respostaCorreta: RespostaCorreta;
  xpTotal: number;
  licao: null | {
    concluida: boolean;
    acertos: number;
    total: number;
    xpGanho: number;
    proximaLicaoId: number | null;
  };
}
