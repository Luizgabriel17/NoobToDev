export class PerfilTrilhaDto {
  id!: number;
  titulo!: string;
  concluidas!: number;
  total!: number;
  percentual!: number;
}

export class PerfilResponseDto {
  id!: number;
  nome!: string;
  email!: string;
  xpTotal!: number;
  licoesConcluidas!: number;
  totalLicoes!: number;
  criadoEm!: Date;
  trilhas!: PerfilTrilhaDto[];
}
