export type PapelUsuario = 'ESTUDANTE' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  xpTotal: number;
  papel: PapelUsuario;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload extends LoginPayload {
  nome: string;
}

export interface AuthResponse {
  accessToken: string;
  usuario: Usuario;
}
