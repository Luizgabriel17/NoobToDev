import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { LicoesController } from './licoes.controller';
import { LicoesService } from './licoes.service';

@Module({
  imports: [ProgressModule],
  controllers: [LicoesController],
  providers: [LicoesService],
})
export class LicoesModule {}
