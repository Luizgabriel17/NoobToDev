import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { StatusLicao, TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LessonProgressState {
  id: number;
  ordem: number;
  moduloOrdem: number;
  progressos: Array<{ status: StatusLicao; xpGanho?: number }>;
}

export interface LessonWithState<T extends LessonProgressState> {
  lesson: T;
  status: StatusLicao;
}

export type ChallengeAnswer =
  | { opcaoId: number }
  | { ordem: number[] };

export interface ChallengeOption {
  id: number;
  correta: boolean;
  posicaoCorreta: number | null;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  calculateLessonStates<T extends LessonProgressState>(
    lessons: readonly T[],
  ): Array<LessonWithState<T>> {
    let previousCompleted = true;

    return lessons.map((lesson) => {
      const completed =
        lesson.progressos[0]?.status === StatusLicao.CONCLUIDA;
      const status = completed
        ? StatusLicao.CONCLUIDA
        : previousCompleted
          ? StatusLicao.DISPONIVEL
          : StatusLicao.BLOQUEADA;

      previousCompleted = status === StatusLicao.CONCLUIDA;
      return { lesson, status };
    });
  }

  async getLessonStates(usuarioId: number, trilhaId: number) {
    const lessons = await this.prisma.licao.findMany({
      where: {
        publicada: true,
        modulo: { trilhaId },
      },
      select: {
        id: true,
        ordem: true,
        modulo: { select: { ordem: true } },
        progressos: {
          where: { usuarioId },
          select: { status: true, xpGanho: true },
        },
      },
      orderBy: [{ modulo: { ordem: 'asc' } }, { ordem: 'asc' }],
    });

    return this.calculateLessonStates(
      lessons.map((lesson) => ({
        id: lesson.id,
        ordem: lesson.ordem,
        moduloOrdem: lesson.modulo.ordem,
        progressos: lesson.progressos,
      })),
    );
  }

  async requireAvailableLesson(
    usuarioId: number,
    trilhaId: number,
    licaoId: number,
  ) {
    const states = await this.getLessonStates(usuarioId, trilhaId);
    const state = states.find(({ lesson }) => lesson.id === licaoId);

    if (!state || state.status === StatusLicao.BLOQUEADA) {
      throw new ForbiddenException('Esta lição ainda está bloqueada.');
    }

    return {
      status: state.status,
      nextLessonId:
        states[states.findIndex(({ lesson }) => lesson.id === licaoId) + 1]
          ?.lesson.id ?? null,
    };
  }

  evaluateAnswer(
    tipo: TipoDesafio,
    resposta: ChallengeAnswer,
    opcoes: readonly ChallengeOption[],
  ): { acertou: boolean; respostaCorreta: ChallengeAnswer } {
    if (tipo === TipoDesafio.ESCOLHA_UNICA) {
      if (!('opcaoId' in resposta)) {
        throw new BadRequestException(
          'A resposta de escolha única deve conter opcaoId.',
        );
      }

      const selecionada = opcoes.find(({ id }) => id === resposta.opcaoId);
      if (!selecionada) {
        throw new BadRequestException(
          'A opção informada não pertence a este desafio.',
        );
      }

      const correta = opcoes.find(({ correta: isCorrect }) => isCorrect);
      if (!correta) {
        throw new BadRequestException(
          'O desafio não possui uma opção correta configurada.',
        );
      }

      return {
        acertou: selecionada.correta,
        respostaCorreta: { opcaoId: correta.id },
      };
    }

    if (!('ordem' in resposta)) {
      throw new BadRequestException(
        'A resposta de ordenação deve conter ordem.',
      );
    }

    const ids = opcoes.map(({ id }) => id);
    if (
      resposta.ordem.length !== ids.length ||
      new Set(resposta.ordem).size !== ids.length ||
      resposta.ordem.some((id) => !ids.includes(id))
    ) {
      throw new BadRequestException(
        'A ordem deve conter uma vez cada opção deste desafio.',
      );
    }

    const ordenadas = [...opcoes].sort(
      (a, b) => (a.posicaoCorreta ?? Number.MAX_SAFE_INTEGER) -
        (b.posicaoCorreta ?? Number.MAX_SAFE_INTEGER),
    );
    if (
      ordenadas.some((opcao) => opcao.posicaoCorreta === null) ||
      new Set(ordenadas.map(({ posicaoCorreta }) => posicaoCorreta)).size !==
        ordenadas.length
    ) {
      throw new BadRequestException(
        'O desafio não possui uma ordem correta configurada.',
      );
    }

    const ordemCorreta = ordenadas.map(({ id }) => id);
    return {
      acertou: resposta.ordem.every((id, index) => id === ordemCorreta[index]),
      respostaCorreta: { ordem: ordemCorreta },
    };
  }

  shouldGrantXp(acertou: boolean, acertouAntes: boolean): boolean {
    return acertou && !acertouAntes;
  }

  isLessonCompleted(
    challengeIds: readonly number[],
    answeredChallengeIds: readonly number[],
  ): boolean {
    const answered = new Set(answeredChallengeIds);
    return (
      challengeIds.length > 0 &&
      challengeIds.every((challengeId) => answered.has(challengeId))
    );
  }

  embaralhar<T>(items: readonly T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[otherIndex]] = [
        shuffled[otherIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  exigirDisponibilidade(status: StatusLicao): void {
    if (status === StatusLicao.BLOQUEADA) {
      throw new ForbiddenException('Esta lição ainda está bloqueada.');
    }
  }
}
