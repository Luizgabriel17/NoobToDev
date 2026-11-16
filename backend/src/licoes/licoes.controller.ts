import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { LicoesService } from './licoes.service';

@Controller('licoes')
@UseGuards(JwtAuthGuard)
export class LicoesController {
  constructor(private readonly licoes: LicoesService) {}

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('O id da lição deve ser um número inteiro.'),
      }),
    )
    id: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.licoes.findOne(req.user.id, id);
  }
}
