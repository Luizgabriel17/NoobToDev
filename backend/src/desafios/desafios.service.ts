import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusLicao, TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeAnswer, ProgressService } from '../progress/progress.service';
import {
  RespostaDesafioDto,
  RespostaDesafioResponseDto,
} from './dto/resposta-desafio.dto';

@Injectable()
export class DesafiosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  async responder(
    usuarioId: number,
    desafioId: number,
    dto: RespostaDesafioDto,
  ): Promise<RespostaDesafioResponseDto> {
    const desafio = await this.prisma.desafio.findUnique({
      where: { id: desafioId },
      select: {
        id: true,
        tipo: true,
        pontos: true,
        explicacao: true,
        dica: true,
        conteudo: true,
        opcoes: {
          select: { id: true, correta: true, posicaoCorreta: true },
        },
        licao: {
          select: {
            id: true,
            publicada: true,
            desafios: { select: { id: true } },
            modulo: {
              select: {
                trilha: {
                  select: { id: true, linguagem: { select: { ativa: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (
      !desafio ||
      !desafio.licao.publicada ||
      !desafio.licao.modulo.trilha.linguagem.ativa
    ) {
      throw new NotFoundException('Desafio não encontrado.');
    }

    const answer = this.validarFormato(desafio.tipo, dto);
    const evaluation =
      'codigo' in answer
        ? this.progress.evaluateCodeAnswer(answer.codigo, desafio.conteudo)
        : 'respostaTexto' in answer
          ? this.progress.evaluateBlankAnswer(
              answer.respostaTexto,
              desafio.conteudo,
            )
          : this.progress.evaluateAnswer(desafio.tipo, answer, desafio.opcoes);
    const access = await this.progress.requireAvailableLesson(
      usuarioId,
      desafio.licao.modulo.trilha.id,
      desafio.licao.id,
    );

    const resultado = await this.prisma.$transaction(
      async (transaction) => {
        await transaction.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM usuarios WHERE id = ${usuarioId} FOR UPDATE
      `;
        const acertouAntes = Boolean(
          await transaction.tentativa.findFirst({
            where: { usuarioId, desafioId, acertou: true },
            select: { id: true },
          }),
        );
        const xpGanho = this.progress.shouldGrantXp(
          evaluation.acertou,
          acertouAntes,
        )
          ? desafio.pontos
          : 0;

        await transaction.tentativa.create({
          data: {
            usuarioId,
            desafioId,
            resposta: answer as Prisma.InputJsonValue,
            acertou: evaluation.acertou,
          },
        });

        const tentativasDaLicao = await transaction.tentativa.findMany({
          where: {
            usuarioId,
            desafio: { licaoId: desafio.licao.id },
          },
          select: {
            desafioId: true,
            acertou: true,
          },
        });
        const challengeIds = desafio.licao.desafios.map(({ id }) => id);
        const answeredChallengeIds = tentativasDaLicao
          .filter(({ acertou }) => acertou)
          .map(({ desafioId: id }) => id);
        const concluida = this.progress.isLessonCompleted(
          challengeIds,
          answeredChallengeIds,
        );
        const progressRecord = await transaction.progressoLicao.findUnique({
          where: {
            usuarioId_licaoId: { usuarioId, licaoId: desafio.licao.id },
          },
          select: { status: true, xpGanho: true, concluidaEm: true },
        });
        const status =
          concluida || progressRecord?.status === StatusLicao.CONCLUIDA
            ? StatusLicao.CONCLUIDA
            : access.status;
        const concluidaEm =
          status === StatusLicao.CONCLUIDA
            ? (progressRecord?.concluidaEm ?? new Date())
            : null;

        await transaction.progressoLicao.upsert({
          where: {
            usuarioId_licaoId: { usuarioId, licaoId: desafio.licao.id },
          },
          create: {
            usuarioId,
            licaoId: desafio.licao.id,
            status,
            xpGanho,
            concluidaEm,
          },
          update: {
            status,
            xpGanho: { increment: xpGanho },
            concluidaEm,
          },
        });
        const usuario = await transaction.usuario.update({
          where: { id: usuarioId },
          data: { xpTotal: { increment: xpGanho } },
          select: { xpTotal: true },
        });
        const acertos = new Set(
          tentativasDaLicao
            .filter(({ acertou }) => acertou)
            .map(({ desafioId: id }) => id),
        ).size;

        return {
          xpTotal: usuario.xpTotal,
          xpDesafio: xpGanho,
          xpLicao: (progressRecord?.xpGanho ?? 0) + xpGanho,
          concluida,
          acertos,
          total: challengeIds.length,
        };
      },
      { maxWait: 10_000, timeout: 30_000 },
    );

    return {
      acertou: evaluation.acertou,
      xpGanho: resultado.xpDesafio,
      explicacao: desafio.explicacao,
      dica: evaluation.acertou ? null : desafio.dica,
      xpTotal: resultado.xpTotal,
      licao: resultado.concluida
        ? {
            concluida: true,
            acertos: resultado.acertos,
            total: resultado.total,
            xpGanho: resultado.xpLicao,
            proximaLicaoId: access.nextLessonId,
          }
        : null,
    };
  }

  private validarFormato(
    tipo: TipoDesafio,
    dto: RespostaDesafioDto,
  ): ChallengeAnswer {
    if (tipo === TipoDesafio.ESCRITA_CODIGO) {
      if (
        typeof dto.codigo !== 'string' ||
        dto.codigo.trim().length === 0 ||
        dto.opcaoId !== undefined ||
        dto.ordem !== undefined ||
        dto.respostaTexto !== undefined
      ) {
        throw new BadRequestException(
          'Informe somente um código não vazio para este desafio.',
        );
      }
      return { codigo: dto.codigo };
    }

    if (dto.codigo !== undefined) {
      throw new BadRequestException(
        'O campo codigo só pode ser usado em desafios de escrita de código.',
      );
    }

    if (tipo === TipoDesafio.COMPLETAR_LACUNAS) {
      if (
        typeof dto.respostaTexto !== 'string' ||
        dto.respostaTexto.trim().length === 0 ||
        dto.opcaoId !== undefined ||
        dto.ordem !== undefined
      ) {
        throw new BadRequestException(
          'Informe somente uma resposta não vazia para completar as lacunas.',
        );
      }
      return { respostaTexto: dto.respostaTexto };
    }

    if (dto.respostaTexto !== undefined) {
      throw new BadRequestException(
        'O campo respostaTexto só pode ser usado para completar lacunas.',
      );
    }

    if (
      tipo === TipoDesafio.ESCOLHA_UNICA ||
      tipo === TipoDesafio.ENCONTRAR_ERRO
    ) {
      if (typeof dto.opcaoId !== 'number' || dto.ordem !== undefined) {
        throw new BadRequestException(
          'Informe somente opcaoId para este desafio.',
        );
      }
      return { opcaoId: dto.opcaoId };
    }

    if (dto.opcaoId !== undefined || !Array.isArray(dto.ordem)) {
      throw new BadRequestException('Informe somente ordem para este desafio.');
    }
    if (dto.ordem.some((item) => !Number.isInteger(item) || item < 1)) {
      throw new BadRequestException(
        'A ordem deve conter somente ids inteiros positivos.',
      );
    }
    return { ordem: dto.ordem };
  }
}
