import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import type { TrilhaResponseDto } from './dto/trilha.dto';

@Injectable()
export class TrilhasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  async findAll(usuarioId: number): Promise<TrilhaResponseDto[]> {
    const trilhas = await this.prisma.trilha.findMany({
      where: { linguagem: { ativa: true } },
      select: {
        id: true,
        titulo: true,
        ordem: true,
        linguagem: { select: { id: true, nome: true, slug: true } },
        modulos: {
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            titulo: true,
            ordem: true,
            licoes: {
              where: { publicada: true },
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                titulo: true,
                ordem: true,
                tipo: true,
                progressos: {
                  where: { usuarioId },
                  select: { status: true, xpGanho: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ linguagemId: 'asc' }, { ordem: 'asc' }],
    });

    return trilhas.map((trilha) => {
      const states = this.progress.calculateLessonStates(
        trilha.modulos.flatMap((modulo) =>
          modulo.licoes.map((licao) => ({
            id: licao.id,
            ordem: licao.ordem,
            moduloOrdem: modulo.ordem,
            progressos: licao.progressos,
          })),
        ),
      );
      const stateById = new Map(
        states.map(({ lesson, status }) => [lesson.id, status]),
      );
      const licoes = trilha.modulos.flatMap((modulo) => modulo.licoes);
      const concluidas = licoes.filter(
        (licao) => stateById.get(licao.id) === 'CONCLUIDA',
      ).length;

      return {
        id: trilha.id,
        titulo: trilha.titulo,
        linguagem: trilha.linguagem,
        progresso: {
          concluidas,
          total: licoes.length,
          percentual:
            licoes.length === 0
              ? 0
              : Math.round((concluidas / licoes.length) * 100),
        },
        modulos: trilha.modulos.map((modulo) => ({
          id: modulo.id,
          titulo: modulo.titulo,
          ordem: modulo.ordem,
          xpGanho: modulo.licoes.reduce(
            (total, licao) => total + (licao.progressos[0]?.xpGanho ?? 0),
            0,
          ),
          emBreve: modulo.licoes.length === 0,
          licoes: modulo.licoes.map((licao) => ({
            id: licao.id,
            titulo: licao.titulo,
            ordem: licao.ordem,
            tipo: licao.tipo,
            status: stateById.get(licao.id) ?? 'BLOQUEADA',
            xpGanho: licao.progressos[0]?.xpGanho ?? 0,
          })),
        })),
      };
    });
  }
}
