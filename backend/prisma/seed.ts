import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Papel, PrismaClient, TipoDesafio } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Defina DATABASE_URL para executar o seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type OptionSeed = {
  texto: string;
  correta?: boolean;
  posicaoCorreta?: number;
};

type ChallengeSeed = {
  tipo: TipoDesafio;
  enunciado: string;
  explicacao: string;
  pontos: number;
  opcoes: OptionSeed[];
};

type LessonSeed = {
  titulo: string;
  desafios: ChallengeSeed[];
};

const modules: Array<{ titulo: string; licoes: LessonSeed[] }> = [
  {
    titulo: 'Introdução ao HTML',
    licoes: [
      {
        titulo: 'Estrutura básica de uma página',
        desafios: [
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado: 'Ordene as tags principais de um documento HTML.',
            explicacao:
              'A tag html envolve o documento; head contém metadados e body contém o conteúdo da página.',
            pontos: 10,
            opcoes: [
              { texto: '<html>', posicaoCorreta: 1 },
              { texto: '<head>', posicaoCorreta: 2 },
              { texto: '<body>', posicaoCorreta: 3 },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Onde ficam os metadados e o título da página?',
            explicacao:
              'A seção head contém metadados, links para recursos e o elemento title.',
            pontos: 10,
            opcoes: [
              { texto: '<head>', correta: true },
              { texto: '<body>' },
              { texto: '<footer>' },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual elemento envolve o conteúdo exibido da página?',
            explicacao:
              'O conteúdo apresentado ao visitante fica dentro do elemento body.',
            pontos: 10,
            opcoes: [
              { texto: '<body>', correta: true },
              { texto: '<head>' },
              { texto: '<meta>' },
            ],
          },
        ],
      },
      {
        titulo: 'Textos, links e imagens',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual elemento representa o título principal de uma página?',
            explicacao:
              'h1 representa o título de maior nível da página; use os níveis de título conforme a hierarquia do conteúdo.',
            pontos: 10,
            opcoes: [
              { texto: '<h1>', correta: true },
              { texto: '<p>' },
              { texto: '<a>' },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual elemento é usado para criar um parágrafo?',
            explicacao: 'O elemento p delimita um parágrafo de texto.',
            pontos: 10,
            opcoes: [
              { texto: '<p>', correta: true },
              { texto: '<h1>' },
              { texto: '<img>' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado: 'Organize os trechos para criar um link HTML.',
            explicacao:
              'O elemento a envolve o texto do link e o atributo href informa o endereço de destino.',
            pontos: 10,
            opcoes: [
              {
                texto: '<a href="https://exemplo.com">',
                posicaoCorreta: 1,
              },
              { texto: 'Visitar site', posicaoCorreta: 2 },
              { texto: '</a>', posicaoCorreta: 3 },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual atributo de img fornece uma descrição alternativa da imagem?',
            explicacao:
              'O atributo alt fornece texto alternativo, útil para acessibilidade e quando a imagem não pode ser carregada.',
            pontos: 10,
            opcoes: [
              { texto: 'alt', correta: true },
              { texto: 'href' },
              { texto: 'target' },
            ],
          },
        ],
      },
    ],
  },
  {
    titulo: 'Introdução ao CSS',
    licoes: [
      {
        titulo: 'Cores e tamanho da fonte',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual propriedade CSS altera a cor do texto?',
            explicacao: 'A propriedade color define a cor do conteúdo textual.',
            pontos: 10,
            opcoes: [
              { texto: 'color', correta: true },
              { texto: 'background-color' },
              { texto: 'font-size' },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual propriedade altera a cor de fundo de um elemento?',
            explicacao:
              'A propriedade background-color define a cor de fundo do elemento.',
            pontos: 10,
            opcoes: [
              { texto: 'background-color', correta: true },
              { texto: 'color' },
              { texto: 'text-align' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado: 'Ordene os trechos para formar uma regra CSS válida.',
            explicacao:
              'Uma regra CSS começa pelo seletor, abre chaves, declara as propriedades e fecha as chaves.',
            pontos: 10,
            opcoes: [
              { texto: 'p {', posicaoCorreta: 1 },
              { texto: 'font-size: 18px;', posicaoCorreta: 2 },
              { texto: '}', posicaoCorreta: 3 },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual declaração aumenta o tamanho da fonte para 20 pixels?',
            explicacao:
              'font-size controla o tamanho da fonte; 20px define vinte pixels.',
            pontos: 10,
            opcoes: [
              { texto: 'font-size: 20px;', correta: true },
              { texto: 'color: 20px;' },
              { texto: 'background-color: 20px;' },
            ],
          },
        ],
      },
      {
        titulo: 'Alinhamento e regras CSS',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual propriedade CSS alinha o texto ao centro?',
            explicacao:
              'text-align: center centraliza o texto dentro do espaço disponível.',
            pontos: 10,
            opcoes: [
              { texto: 'text-align: center;', correta: true },
              { texto: 'font-size: center;' },
              { texto: 'color: center;' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado: 'Ordene os trechos para aplicar cor de texto e cor de fundo.',
            explicacao:
              'As declarações ficam dentro das chaves do seletor. Cada declaração termina com ponto e vírgula.',
            pontos: 10,
            opcoes: [
              { texto: '.aviso {', posicaoCorreta: 1 },
              { texto: 'color: white;', posicaoCorreta: 2 },
              { texto: 'background-color: navy;', posicaoCorreta: 3 },
              { texto: '}', posicaoCorreta: 4 },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Em CSS, o que seleciona todos os elementos h1?',
            explicacao:
              'O seletor de tipo h1 seleciona os elementos HTML com essa tag.',
            pontos: 10,
            opcoes: [
              { texto: 'h1', correta: true },
              { texto: 'font-size' },
              { texto: 'color' },
            ],
          },
        ],
      },
    ],
  },
];

async function seedContent() {
  await prisma.$transaction(async (transaction) => {
    const linguagem = await transaction.linguagem.upsert({
      where: { slug: 'html-css' },
      update: { nome: 'HTML e CSS', ativa: true },
      create: { nome: 'HTML e CSS', slug: 'html-css', ativa: true },
    });
    const trilha = await transaction.trilha.upsert({
      where: {
        linguagemId_ordem: { linguagemId: linguagem.id, ordem: 1 },
      },
      update: { titulo: 'Fundamentos de Desenvolvimento Web' },
      create: {
        linguagemId: linguagem.id,
        titulo: 'Fundamentos de Desenvolvimento Web',
        ordem: 1,
      },
    });

    for (const [moduleIndex, moduleSeed] of modules.entries()) {
      const modulo = await transaction.modulo.upsert({
        where: { trilhaId_ordem: { trilhaId: trilha.id, ordem: moduleIndex + 1 } },
        update: { titulo: moduleSeed.titulo },
        create: {
          trilhaId: trilha.id,
          titulo: moduleSeed.titulo,
          ordem: moduleIndex + 1,
        },
      });

      for (const [lessonIndex, lessonSeed] of moduleSeed.licoes.entries()) {
        const licao = await transaction.licao.upsert({
          where: {
            moduloId_ordem: { moduloId: modulo.id, ordem: lessonIndex + 1 },
          },
          update: { titulo: lessonSeed.titulo, publicada: true },
          create: {
            moduloId: modulo.id,
            titulo: lessonSeed.titulo,
            ordem: lessonIndex + 1,
            publicada: true,
          },
        });

        for (const [challengeIndex, challengeSeed] of lessonSeed.desafios.entries()) {
          const existing = await transaction.desafio.findFirst({
            where: { licaoId: licao.id, ordem: challengeIndex + 1 },
            select: { id: true },
          });
          const challengeData = {
            tipo: challengeSeed.tipo,
            enunciado: challengeSeed.enunciado,
            explicacao: challengeSeed.explicacao,
            pontos: challengeSeed.pontos,
            ordem: challengeIndex + 1,
          };
          const options = challengeSeed.opcoes.map((option) => ({
            texto: option.texto,
            correta: option.correta ?? false,
            posicaoCorreta: option.posicaoCorreta ?? null,
          }));

          if (existing) {
            await transaction.desafio.update({
              where: { id: existing.id },
              data: {
                ...challengeData,
                opcoes: { deleteMany: {}, create: options },
              },
            });
          } else {
            await transaction.desafio.create({
              data: {
                licaoId: licao.id,
                ...challengeData,
                opcoes: { create: options },
              },
            });
          }
        }
      }
    }
  }, { maxWait: 15_000, timeout: 60_000 });
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.SEED_ADMIN_SENHA;
  if (!email || !senha) {
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await prisma.usuario.upsert({
    where: { email },
    update: { papel: Papel.ADMIN },
    create: {
      nome: 'Administrador de desenvolvimento',
      email,
      senhaHash,
      papel: Papel.ADMIN,
    },
  });
}

async function main() {
  await seedContent();
  await seedAdmin();
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
