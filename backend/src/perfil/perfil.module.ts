import { Module } from '@nestjs/common';
import { TrilhasModule } from '../trilhas/trilhas.module';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';

@Module({
  imports: [TrilhasModule],
  controllers: [PerfilController],
  providers: [PerfilService],
})
export class PerfilModule {}
