export interface TrilhaPerfil {
  id: number;
  titulo: string;
  concluidas: number;
  total: number;
  percentual: number;
}

export interface PerfilUsuario {
  id: number;
  nome: string;
  email: string;
  xpTotal: number;
  licoesConcluidas: number;
  totalLicoes: number;
  criadoEm: string;
  trilhas: TrilhaPerfil[];
}
