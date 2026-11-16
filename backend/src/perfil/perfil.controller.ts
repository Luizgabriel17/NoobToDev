import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { PerfilService } from './perfil.service';

@Controller('perfil')
@UseGuards(JwtAuthGuard)
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get()
  findOne(@Req() req: { user: { id: number } }) {
    return this.perfil.findOne(req.user.id);
  }
}
