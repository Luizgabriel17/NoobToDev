import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { DesafiosService } from './desafios.service';

describe('DesafiosService', () => {
  const licaoId = 4;
  const desafioId = 10;

  function criarService(
    acertouAntes: boolean,
    tipo = 'ESCOLHA_UNICA',
    conteudo: unknown = null,
    tentativaAcertou = true,
  ) {
    const tentativas = {
      findFirst: jest.fn().mockResolvedValue(acertouAntes ? { id: 1 } : null),
      create: jest.fn().mockResolvedValue({ id: 2 }),
      findMany: jest.fn().mockResolvedValue([
        {
          desafioId,
          acertou: tentativaAcertou,
          desafio: { tipo },
        },
      ]),
    };
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 7 }]),
      tentativa: tentativas,
      progressoLicao: {
        findUnique: jest.fn().mockResolvedValue(
          acertouAntes
            ? {
                status: 'CONCLUIDA',
                xpGanho: 10,
                concluidaEm: new Date('2026-01-01T00:00:00.000Z'),
              }
            : null,
        ),
        upsert: jest.fn().mockResolvedValue({}),
      },
      usuario: {
        update: jest
          .fn()
          .mockResolvedValue({ xpTotal: acertouAntes ? 10 : 10 }),
      },
    };
    const prisma = {
      desafio: {
        findUnique: jest.fn().mockResolvedValue({
          id: desafioId,
          tipo,
          pontos: 10,
          explicacao: 'A resposta correta é a primeira opção.',
          conteudo,
          opcoes: [
            { id: 30, correta: true, posicaoCorreta: null },
            { id: 31, correta: false, posicaoCorreta: null },
          ],
          licao: {
            id: licaoId,
            publicada: true,
            desafios: [{ id: desafioId }],
            modulo: { trilha: { id: 2, linguagem: { ativa: true } } },
          },
        }),
      },
      licao: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: licaoId,
            ordem: 1,
            modulo: { ordem: 1 },
            progressos: [],
          },
        ]),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          (callback: (tx: typeof transaction) => Promise<unknown>) =>
            callback(transaction),
        ),
    };
    const progress = new ProgressService(prisma as unknown as PrismaService);
    const service = new DesafiosService(
      prisma as unknown as PrismaService,
      progress,
    );

    return { service, prisma, transaction };
  }

  it('registra a tentativa, concede XP uma vez e conclui a lição', async () => {
    const { service, prisma, transaction } = criarService(false);

    const resposta = await service.responder(7, desafioId, { opcaoId: 30 });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(1);
    expect(transaction.tentativa.create).toHaveBeenCalledWith({
      data: {
        usuarioId: 7,
        desafioId,
        resposta: { opcaoId: 30 },
        acertou: true,
      },
    });
    expect(transaction.usuario.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { xpTotal: { increment: 10 } },
      select: { xpTotal: true },
    });
    expect(resposta).toMatchObject({
      acertou: true,
      xpGanho: 10,
      licao: { concluida: true, acertos: 1, total: 1, xpGanho: 10 },
    });
  });

  it('não concede novamente XP para uma resposta correta já registrada', async () => {
    const { service, transaction } = criarService(true);

    const resposta = await service.responder(7, desafioId, { opcaoId: 30 });

    expect(transaction.usuario.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { xpTotal: { increment: 0 } },
      select: { xpTotal: true },
    });
    expect(resposta.xpGanho).toBe(0);
    expect(resposta.licao?.xpGanho).toBe(10);
  });

  it('não revela a solução nem conclui a lição após um código incorreto', async () => {
    const config = {
      linguagem: 'html',
      verificacoes: [{ tipo: 'HTML_ELEMENT', tag: 'h1', texto: 'Olá' }],
    };
    const { service, transaction } = criarService(
      false,
      'ESCRITA_CODIGO',
      config,
      false,
    );

    const resposta = await service.responder(7, desafioId, {
      codigo: '<h1>Tchau</h1>',
    });

    expect(transaction.tentativa.create).toHaveBeenCalledWith({
      data: {
        usuarioId: 7,
        desafioId,
        resposta: { codigo: '<h1>Tchau</h1>' },
        acertou: false,
      },
    });
    expect(resposta).toMatchObject({
      acertou: false,
      xpGanho: 0,
      respostaCorreta: null,
      licao: null,
    });
  });
});
