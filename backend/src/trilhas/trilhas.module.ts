import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';

@Module({
  imports: [ProgressModule],
  controllers: [TrilhasController],
  providers: [TrilhasService],
  exports: [TrilhasService],
})
export class TrilhasModule {}
