import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { TrilhasService } from './trilhas.service';

@Controller('trilhas')
@UseGuards(JwtAuthGuard)
export class TrilhasController {
  constructor(private readonly trilhas: TrilhasService) {}

  @Get()
  findAll(@Req() req: { user: { id: number } }) {
    return this.trilhas.findAll(req.user.id);
  }
}
