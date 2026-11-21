import { BadRequestException } from '@nestjs/common';
import { StatusLicao, TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  const service = new ProgressService({
    licao: { findMany: jest.fn() },
  } as unknown as PrismaService);

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

  it('corrige ENCONTRAR_ERRO usando escolha única no servidor', () => {
    const opcoes = [
      { id: 10, correta: false, posicaoCorreta: null },
      { id: 11, correta: true, posicaoCorreta: null },
    ];

    expect(
      service.evaluateAnswer(
        TipoDesafio.ENCONTRAR_ERRO,
        { opcaoId: 11 },
        opcoes,
      ),
    ).toEqual({ acertou: true, respostaCorreta: { opcaoId: 11 } });
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

  it('corrige exercícios de HTML sem considerar instruções em comentários', () => {
    const config = {
      linguagem: 'html',
      verificacoes: [
        {
          tipo: 'HTML_ELEMENT',
          tag: 'h1',
          texto: 'Minha página',
        },
        {
          tipo: 'HTML_ATTRIBUTE',
          tag: 'img',
          atributo: 'alt',
          valor: 'Paisagem',
        },
      ],
    };

    expect(
      service.evaluateCodeAnswer(
        '<!-- <h1>Minha página</h1> -->\n<h1>Minha página</h1><img alt="Paisagem">',
        config,
      ),
    ).toEqual({ acertou: true, respostaCorreta: null });
    expect(
      service.evaluateCodeAnswer(
        '<h1>Outra página</h1><img alt="Paisagem">',
        config,
      ).acertou,
    ).toBe(false);
  });

  it('analisa HTML sem exigir capitalização, aspas ou espaços exatos', () => {
    const config = {
      linguagem: 'html',
      verificacoes: [
        { tipo: 'HTML_ELEMENT', tag: 'h1', texto: 'Minha página' },
        {
          tipo: 'HTML_ATTRIBUTE',
          tag: 'img',
          atributo: 'alt',
          valor: 'Paisagem',
        },
      ],
    };

    expect(
      service.evaluateCodeAnswer(
        '<!-- <h1>Minha página</h1> --><H1>Minha&nbsp; página</H1><img alt=Paisagem>',
        config,
      ).acertou,
    ).toBe(true);
  });

  it('corrige declarações CSS mesmo com espaços e regras em media query', () => {
    const config = {
      linguagem: 'css',
      verificacoes: [
        {
          tipo: 'CSS_MEDIA_QUERY',
          condicao: '(max-width: 600px)',
        },
        {
          tipo: 'CSS_DECLARATION',
          seletor: '.container',
          propriedade: 'flex-direction',
          valor: 'column',
        },
      ],
    };

    expect(
      service.evaluateCodeAnswer(
        '@media ( max-width: 600px ) { .container { flex-direction : column; } }',
        config,
      ).acertou,
    ).toBe(true);
    expect(
      service.evaluateCodeAnswer('.container { flex-direction: row; }', config)
        .acertou,
    ).toBe(false);
  });

  it('valida JavaScript por estrutura sem executar o código', () => {
    const config = {
      linguagem: 'javascript',
      verificacoes: [
        { tipo: 'JS_DECLARATION', nome: 'nomes', especie: 'const' },
        { tipo: 'JS_FUNCTION', nome: 'nomesAtivos' },
        { tipo: 'JS_ARRAY_METHOD', metodo: 'filter' },
        { tipo: 'JS_ARRAY_METHOD', metodo: 'map' },
      ],
    };

    expect(
      service.evaluateCodeAnswer(
        'const nomes = []; const nomesAtivos = (itens) => itens.filter(Boolean).map(String);',
        config,
      ).acertou,
    ).toBe(true);
    expect(
      service.evaluateCodeAnswer(
        'const nomes = []; const nomesAtivos = (itens) => itens.map(String);',
        config,
      ).acertou,
    ).toBe(false);
    expect(service.evaluateCodeAnswer('const = ;', config).acertou).toBe(false);
    expect(() =>
      service.evaluateCodeAnswer('const nomes = [];', {
        ...config,
        verificacoes: [
          { tipo: 'JS_DECLARATION', nome: 'nomes', especie: 'const' },
        ],
        linguagem: 'html',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita configuração inválida de exercício de código', () => {
    expect(() => service.evaluateCodeAnswer('<h1>Olá</h1>', {})).toThrow(
      BadRequestException,
    );
  });

  it('corrige lacunas sem diferenciar maiúsculas ou espaços redundantes', () => {
    const config = {
      orientacao: 'Complete a lacuna.',
      codigoInicial: 'const linguagem = ____;',
      respostasAceitas: ['JavaScript', ' JS '],
    };

    expect(service.evaluateBlankAnswer(' javascript  ', config).acertou).toBe(
      true,
    );
    expect(service.evaluateBlankAnswer('Python', config).acertou).toBe(false);
    expect(() => service.evaluateBlankAnswer('x', {})).toThrow(
      BadRequestException,
    );
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
