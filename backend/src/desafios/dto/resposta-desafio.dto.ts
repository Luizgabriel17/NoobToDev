import { ArrayNotEmpty, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class RespostaDesafioDto {
  @IsOptional()
  @IsInt({ message: 'A opção deve ser um número inteiro.' })
  @Min(1, { message: 'A opção deve ser um número positivo.' })
  opcaoId?: number;

  @IsOptional()
  @IsArray({ message: 'A ordem deve ser uma lista de opções.' })
  @ArrayNotEmpty({ message: 'A ordem não pode estar vazia.' })
  @IsInt({ each: true, message: 'Cada opção da ordem deve ser um número inteiro.' })
  @Min(1, { each: true, message: 'Cada opção deve ser um número positivo.' })
  ordem?: number[];
}
