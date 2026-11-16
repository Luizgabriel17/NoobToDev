import { BadRequestException } from '@nestjs/common';
import { StatusLicao, TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  const service = new ProgressService(
    { licao: { findMany: jest.fn() } } as unknown as PrismaService,
  );

  it('calcula o desbloqueio sequencial das lições', () => {
    const states = service.calculateLessonStates([
      {
        id: 1,
        ordem: 1,
        moduloOrdem: 1,
        progressos: [{ status: StatusLicao.CONCLUIDA }],
      },
      { id: 2, ordem: 2, moduloOrdem: 1, progressos: [] },
      { id: 3, ordem: 1, moduloOrdem: 2, progressos: [] },
    ]);

    expect(states.map(({ status }) => status)).toEqual([
      StatusLicao.CONCLUIDA,
      StatusLicao.DISPONIVEL,
      StatusLicao.BLOQUEADA,
    ]);
  });

  it('corrige ESCOLHA_UNICA e rejeita opção de outro desafio', () => {
    const opcoes = [
      { id: 10, correta: false, posicaoCorreta: null },
      { id: 11, correta: true, posicaoCorreta: null },
    ];

    expect(
      service.evaluateAnswer(
        TipoDesafio.ESCOLHA_UNICA,
        { opcaoId: 11 },
        opcoes,
      ),
    ).toEqual({
      acertou: true,
      respostaCorreta: { opcaoId: 11 },
    });
    expect(() =>
      service.evaluateAnswer(
        TipoDesafio.ESCOLHA_UNICA,
        { opcaoId: 99 },
        opcoes,
      ),
    ).toThrow(BadRequestException);
  });

  it('corrige ORDENACAO e rejeita respostas incompletas', () => {
    const opcoes = [
      { id: 20, correta: false, posicaoCorreta: 2 },
      { id: 21, correta: false, posicaoCorreta: 1 },
      { id: 22, correta: false, posicaoCorreta: 3 },
    ];

    expect(
      service.evaluateAnswer(
        TipoDesafio.ORDENACAO,
        { ordem: [21, 20, 22] },
        opcoes,
      ),
    ).toEqual({
      acertou: true,
      respostaCorreta: { ordem: [21, 20, 22] },
    });
    expect(() =>
      service.evaluateAnswer(
        TipoDesafio.ORDENACAO,
        { ordem: [21, 20] },
        opcoes,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.evaluateAnswer(
        TipoDesafio.ORDENACAO,
        { ordem: [21, 20, 99] },
        opcoes,
      ),
    ).toThrow(BadRequestException);
  });

  it('concede XP somente na primeira resposta correta', () => {
    expect(service.shouldGrantXp(true, false)).toBe(true);
    expect(service.shouldGrantXp(true, true)).toBe(false);
    expect(service.shouldGrantXp(false, false)).toBe(false);
  });

  it('conclui a lição depois de receber uma resposta para cada desafio', () => {
    expect(service.isLessonCompleted([1, 2, 3], [1, 2])).toBe(false);
    expect(service.isLessonCompleted([1, 2, 3], [1, 2, 3])).toBe(true);
  });
});
