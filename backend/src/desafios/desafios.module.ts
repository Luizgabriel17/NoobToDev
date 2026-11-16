import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { DesafiosController } from './desafios.controller';
import { DesafiosService } from './desafios.service';

@Module({
  imports: [ProgressModule],
  controllers: [DesafiosController],
  providers: [DesafiosService],
})
export class DesafiosModule {}
