import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class LicaoConcluidaResponseDto {
  concluida!: true;
  acertos!: number;
  total!: number;
  xpGanho!: number;
  proximaLicaoId!: number | null;
}

export class RespostaDesafioResponseDto {
  acertou!: boolean;
  xpGanho!: number;
  explicacao!: string | null;
  respostaCorreta!: { opcaoId: number } | { ordem: number[] } | null;
  xpTotal!: number;
  licao!: LicaoConcluidaResponseDto | null;
}

export class RespostaDesafioDto {
  @IsOptional()
  @IsInt({ message: 'A opção deve ser um número inteiro.' })
  @Min(1, { message: 'A opção deve ser um número positivo.' })
  opcaoId?: number;

  @IsOptional()
  @IsArray({ message: 'A ordem deve ser uma lista de opções.' })
  @ArrayNotEmpty({ message: 'A ordem não pode estar vazia.' })
  @IsInt({
    each: true,
    message: 'Cada opção da ordem deve ser um número inteiro.',
  })
  @Min(1, { each: true, message: 'Cada opção deve ser um número positivo.' })
  ordem?: number[];

  @IsOptional()
  @IsString({ message: 'O código deve ser um texto.' })
  @MaxLength(12000, { message: 'O código não pode exceder 12000 caracteres.' })
  codigo?: string;
}
