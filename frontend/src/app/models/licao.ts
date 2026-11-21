export type TipoDesafio =
  'ESCOLHA_UNICA' | 'ORDENACAO' | 'ESCRITA_CODIGO' | 'COMPLETAR_LACUNAS' | 'ENCONTRAR_ERRO';

export type TipoLicao = 'CONTEUDO' | 'PROJETO' | 'REVISAO';

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
  conteudo: unknown | null;
  respondido: boolean;
  opcoes: OpcaoDesafio[];
}

export interface LicaoDetalhe {
  id: number;
  titulo: string;
  moduloTitulo: string;
  status: 'CONCLUIDA' | 'DISPONIVEL' | 'BLOQUEADA';
  tipo: TipoLicao;
  explicacao: string | null;
  exemploCodigo: string | null;
  exemploResultado: string | null;
  desafios: Desafio[];
}

export interface RespostaResultado {
  acertou: boolean;
  xpGanho: number;
  explicacao: string | null;
  dica: string | null;
  xpTotal: number;
  licao: null | {
    concluida: boolean;
    acertos: number;
    total: number;
    xpGanho: number;
    proximaLicaoId: number | null;
  };
}
