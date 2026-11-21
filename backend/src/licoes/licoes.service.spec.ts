import { TipoDesafio, TipoLicao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { LicoesService } from './licoes.service';

describe('LicoesService', () => {
  it('retorna exemplos e configuração pública sem expor gabaritos', async () => {
    const prisma = {
      licao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 8,
          titulo: 'HTML básico',
          publicada: true,
          tipo: TipoLicao.CONTEUDO,
          explicacao: 'A estrutura de uma página começa no HTML.',
          exemploCodigo: '<h1>Olá</h1>',
          exemploResultado: 'Olá',
          modulo: {
            titulo: 'HTML essencial',
            trilha: { id: 2, linguagem: { ativa: true } },
          },
          desafios: [
            {
              id: 10,
              ordem: 1,
              tipo: TipoDesafio.ESCRITA_CODIGO,
              enunciado: 'Crie um título.',
              pontos: 10,
              conteudo: {
                linguagem: 'html',
                orientacao: 'Crie um título.',
                codigoInicial: '<body></body>',
                verificacoes: [
                  { tipo: 'HTML_ELEMENT', tag: 'h1', texto: 'Olá' },
                ],
              },
              opcoes: [{ id: 1, texto: '<h1>', correta: true }],
              tentativas: [],
            },
            {
              id: 11,
              ordem: 2,
              tipo: TipoDesafio.COMPLETAR_LACUNAS,
              enunciado: 'Complete a lacuna.',
              pontos: 10,
              conteudo: {
                orientacao: 'Informe a tag.',
                codigoInicial: '<___>Olá</h1>',
                respostasAceitas: ['h1'],
              },
              opcoes: [],
              tentativas: [],
            },
          ],
        }),
      },
    };
    const progress = {
      requireAvailableLesson: jest
        .fn()
        .mockResolvedValue({ status: 'DISPONIVEL' }),
    };
    const service = new LicoesService(
      prisma as unknown as PrismaService,
      progress as unknown as ProgressService,
    );

    const licao = await service.findOne(4, 8);

    expect(licao).toMatchObject({
      tipo: 'CONTEUDO',
      explicacao: 'A estrutura de uma página começa no HTML.',
      exemploCodigo: '<h1>Olá</h1>',
      exemploResultado: 'Olá',
    });
    expect(licao.desafios[0].conteudo).toEqual({
      linguagem: 'html',
      orientacao: 'Crie um título.',
      codigoInicial: '<body></body>',
    });
    expect(licao.desafios[0].opcoes).toEqual([{ id: 1, texto: '<h1>' }]);
    expect(licao.desafios[1].conteudo).toEqual({
      orientacao: 'Informe a tag.',
      codigoInicial: '<___>Olá</h1>',
    });
    expect(JSON.stringify(licao)).not.toContain('respostasAceitas');
    expect(JSON.stringify(licao)).not.toContain('verificacoes');
    expect(JSON.stringify(licao)).not.toContain('correta');
  });
});
