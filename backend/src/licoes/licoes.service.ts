import { Injectable, NotFoundException } from '@nestjs/common';
import { TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import type { LicaoResponseDto } from './dto/licao.dto';

@Injectable()
export class LicoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  async findOne(usuarioId: number, id: number): Promise<LicaoResponseDto> {
    const licao = await this.prisma.licao.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        publicada: true,
        tipo: true,
        explicacao: true,
        exemploCodigo: true,
        exemploResultado: true,
        modulo: {
          select: {
            titulo: true,
            trilha: {
              select: { id: true, linguagem: { select: { ativa: true } } },
            },
          },
        },
        desafios: {
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            ordem: true,
            tipo: true,
            enunciado: true,
            pontos: true,
            conteudo: true,
            opcoes: {
              orderBy: { id: 'asc' },
              select: { id: true, texto: true },
            },
            tentativas: {
              where: { usuarioId },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!licao || !licao.publicada || !licao.modulo.trilha.linguagem.ativa) {
      throw new NotFoundException('Lição não encontrada.');
    }

    const access = await this.progress.requireAvailableLesson(
      usuarioId,
      licao.modulo.trilha.id,
      id,
    );
    return {
      id: licao.id,
      titulo: licao.titulo,
      moduloTitulo: licao.modulo.titulo,
      status: access.status,
      tipo: licao.tipo,
      explicacao: licao.explicacao,
      exemploCodigo: licao.exemploCodigo,
      exemploResultado: licao.exemploResultado,
      desafios: licao.desafios.map((desafio) => ({
        id: desafio.id,
        ordem: desafio.ordem,
        tipo: desafio.tipo,
        enunciado: desafio.enunciado,
        pontos: desafio.pontos,
        conteudo: this.conteudoPublico(desafio.tipo, desafio.conteudo),
        respondido: desafio.tentativas.length > 0,
        opcoes: (desafio.tipo === TipoDesafio.ORDENACAO
          ? this.progress.embaralhar(desafio.opcoes)
          : desafio.opcoes
        ).map(({ id, texto }) => ({ id, texto })),
      })),
    };
  }

  private conteudoPublico(tipo: TipoDesafio, conteudo: unknown): unknown {
    if (
      tipo !== TipoDesafio.ESCRITA_CODIGO &&
      tipo !== TipoDesafio.COMPLETAR_LACUNAS &&
      tipo !== TipoDesafio.ENCONTRAR_ERRO
    ) {
      return null;
    }

    if (typeof conteudo !== 'object' || conteudo === null) {
      return null;
    }

    if (
      !('orientacao' in conteudo) ||
      typeof conteudo['orientacao'] !== 'string' ||
      !('codigoInicial' in conteudo) ||
      typeof conteudo['codigoInicial'] !== 'string'
    ) {
      return null;
    }

    if (tipo === TipoDesafio.ESCRITA_CODIGO) {
      if (
        !('linguagem' in conteudo) ||
        (conteudo['linguagem'] !== 'html' && conteudo['linguagem'] !== 'css')
      ) {
        return null;
      }

      return {
        linguagem: conteudo['linguagem'],
        orientacao: conteudo['orientacao'],
        codigoInicial: conteudo['codigoInicial'],
      };
    }

    return {
      orientacao: conteudo['orientacao'],
      codigoInicial: conteudo['codigoInicial'],
    };
  }
}
