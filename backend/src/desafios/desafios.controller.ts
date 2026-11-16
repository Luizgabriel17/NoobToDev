import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { DesafiosService } from './desafios.service';
import { RespostaDesafioDto } from './dto/resposta-desafio.dto';

@Controller('desafios')
@UseGuards(JwtAuthGuard)
export class DesafiosController {
  constructor(private readonly desafios: DesafiosService) {}

  @Post(':id/respostas')
  @HttpCode(200)
  responder(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('O id do desafio deve ser um número inteiro.'),
      }),
    )
    id: number,
    @Body() dto: RespostaDesafioDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.desafios.responder(req.user.id, id, dto);
  }
}
