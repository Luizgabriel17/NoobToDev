import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DesafiosModule } from './desafios/desafios.module';
import { LicoesModule } from './licoes/licoes.module';
import { LessonsModule } from './lessons/lessons.module';
import { PerfilModule } from './perfil/perfil.module';
import { PrismaModule } from './prisma/prisma.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    UsersModule,
    LessonsModule,
    TrilhasModule,
    LicoesModule,
    DesafiosModule,
    PerfilModule,
  ],
})
export class AppModule {}
