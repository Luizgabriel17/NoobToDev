import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrilhasService } from '../trilhas/trilhas.service';

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trilhas: TrilhasService,
  ) {}

  async findOne(usuarioId: number) {
    const [usuario, trilhas] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          nome: true,
          email: true,
          xpTotal: true,
          criadoEm: true,
        },
      }),
      this.trilhas.findAll(usuarioId),
    ]);

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const licoesConcluidas = trilhas.reduce(
      (total, trilha) => total + trilha.progresso.concluidas,
      0,
    );
    const totalLicoes = trilhas.reduce(
      (total, trilha) => total + trilha.progresso.total,
      0,
    );

    return {
      ...usuario,
      licoesConcluidas,
      totalLicoes,
      trilhas: trilhas.map((trilha) => ({
        id: trilha.id,
        titulo: trilha.titulo,
        concluidas: trilha.progresso.concluidas,
        total: trilha.progresso.total,
        percentual: trilha.progresso.percentual,
      })),
    };
  }
}
