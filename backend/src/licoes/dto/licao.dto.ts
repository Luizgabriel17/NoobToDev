export class LicaoResponseDto {
  id!: number;
  titulo!: string;
  moduloTitulo!: string;
  status!: string;
  desafios!: Array<{
    id: number;
    ordem: number;
    tipo: string;
    enunciado: string;
    pontos: number;
    conteudo: unknown;
    respondido: boolean;
    opcoes: Array<{ id: number; texto: string }>;
  }>;
}
