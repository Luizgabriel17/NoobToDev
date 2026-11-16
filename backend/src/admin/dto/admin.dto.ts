import { PartialType } from '@nestjs/mapped-types';
import { TipoDesafio, type Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateLinguagemDto {
  @IsString({ message: 'O nome da linguagem deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome da linguagem.' })
  @Matches(/\S/, { message: 'O nome da linguagem não pode ficar vazio.' })
  nome!: string;

  @IsString({ message: 'O slug deve ser um texto.' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'O slug deve conter somente letras minúsculas, números e hífens.',
  })
  slug!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo ativa deve ser verdadeiro ou falso.' })
  ativa?: boolean;
}

export class UpdateLinguagemDto extends PartialType(CreateLinguagemDto) {}

export class CreateTrilhaDto {
  @IsInt({ message: 'O id da linguagem deve ser um número inteiro.' })
  @Min(1, { message: 'O id da linguagem deve ser positivo.' })
  linguagemId!: number;

  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o título da trilha.' })
  @Matches(/\S/, { message: 'O título da trilha não pode ficar vazio.' })
  titulo!: string;

  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @Min(1, { message: 'A ordem deve ser positiva.' })
  ordem!: number;
}

export class UpdateTrilhaDto extends PartialType(CreateTrilhaDto) {}

export class CreateModuloDto {
  @IsInt({ message: 'O id da trilha deve ser um número inteiro.' })
  @Min(1, { message: 'O id da trilha deve ser positivo.' })
  trilhaId!: number;

  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o título do módulo.' })
  @Matches(/\S/, { message: 'O título do módulo não pode ficar vazio.' })
  titulo!: string;

  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @Min(1, { message: 'A ordem deve ser positiva.' })
  ordem!: number;
}

export class UpdateModuloDto extends PartialType(CreateModuloDto) {}

export class CreateLicaoDto {
  @IsInt({ message: 'O id do módulo deve ser um número inteiro.' })
  @Min(1, { message: 'O id do módulo deve ser positivo.' })
  moduloId!: number;

  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o título da lição.' })
  @Matches(/\S/, { message: 'O título da lição não pode ficar vazio.' })
  titulo!: string;

  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @Min(1, { message: 'A ordem deve ser positiva.' })
  ordem!: number;

  @IsOptional()
  @IsBoolean({ message: 'O campo publicada deve ser verdadeiro ou falso.' })
  publicada?: boolean;
}

export class UpdateLicaoDto extends PartialType(CreateLicaoDto) {}

export class CreateOpcaoDto {
  @IsString({ message: 'O texto da opção deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o texto da opção.' })
  @Matches(/\S/, { message: 'O texto da opção não pode ficar vazio.' })
  texto!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo correta deve ser verdadeiro ou falso.' })
  correta?: boolean;

  @IsOptional()
  @IsInt({ message: 'A posição correta deve ser um número inteiro.' })
  @Min(1, { message: 'A posição correta deve ser positiva.' })
  posicaoCorreta?: number;
}

export class CreateDesafioDto {
  @IsInt({ message: 'O id da lição deve ser um número inteiro.' })
  @Min(1, { message: 'O id da lição deve ser positivo.' })
  licaoId!: number;

  @IsEnum(TipoDesafio, { message: 'Informe um tipo de desafio válido.' })
  tipo!: TipoDesafio;

  @IsString({ message: 'O enunciado deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o enunciado do desafio.' })
  @Matches(/\S/, { message: 'O enunciado não pode ficar vazio.' })
  enunciado!: string;

  @IsOptional()
  @IsString({ message: 'A explicação deve ser um texto.' })
  @Matches(/\S/, { message: 'A explicação não pode ficar vazia.' })
  explicacao?: string;

  @IsOptional()
  @IsObject({ message: 'O conteúdo do desafio deve ser um objeto JSON.' })
  conteudo?: Prisma.InputJsonValue;

  @IsInt({ message: 'Os pontos devem ser um número inteiro.' })
  @Min(0, { message: 'Os pontos não podem ser negativos.' })
  pontos!: number;

  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @Min(1, { message: 'A ordem deve ser positiva.' })
  ordem!: number;

  @IsArray({ message: 'As opções devem ser enviadas em uma lista.' })
  @ArrayMinSize(2, { message: 'Informe pelo menos duas opções.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOpcaoDto)
  opcoes!: CreateOpcaoDto[];
}

export class UpdateDesafioDto extends PartialType(CreateDesafioDto) {}
