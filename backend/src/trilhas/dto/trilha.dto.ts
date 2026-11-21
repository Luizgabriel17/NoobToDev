export class TrilhaResponseDto {
  id!: number;
  titulo!: string;
  linguagem!: { id: number; nome: string; slug: string };
  progresso!: { concluidas: number; total: number; percentual: number };
  modulos!: Array<{
    id: number;
    titulo: string;
    ordem: number;
    xpGanho: number;
    emBreve: boolean;
    licoes: Array<{
      id: number;
      titulo: string;
      ordem: number;
      tipo: string;
      status: string;
      xpGanho: number;
    }>;
  }>;
}
