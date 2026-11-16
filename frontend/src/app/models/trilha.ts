export type LicaoStatus = 'CONCLUIDA' | 'DISPONIVEL' | 'BLOQUEADA';

export interface TrilhaProgresso {
  concluidas: number;
  total: number;
  percentual: number;
}

export interface TrilhaLicao {
  id: number;
  titulo: string;
  ordem: number;
  status: LicaoStatus;
  xpGanho: number;
}

export interface TrilhaModulo {
  id: number;
  titulo: string;
  ordem: number;
  licoes: TrilhaLicao[];
}

export interface LinguagemResumo {
  id: number;
  nome: string;
  slug: string;
}

export interface Trilha {
  id: number;
  titulo: string;
  linguagem: LinguagemResumo;
  progresso: TrilhaProgresso;
  modulos: TrilhaModulo[];
}
