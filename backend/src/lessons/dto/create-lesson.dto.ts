import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  @Min(1)
  moduloId!: number;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsInt()
  @Min(1)
  ordem!: number;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}
