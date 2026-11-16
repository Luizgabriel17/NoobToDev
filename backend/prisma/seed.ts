import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Papel, Prisma, PrismaClient, TipoDesafio } from '@prisma/client';
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
  conteudo?: Prisma.InputJsonValue;
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
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Complete a página com o idioma português, um título na aba e um título principal visível.',
            explicacao:
              'O atributo lang informa o idioma do documento. O elemento title fica no head e o h1 dentro do body.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'html',
              orientacao:
                'Edite o documento para criar uma página HTML básica e acessível.',
              codigoInicial:
                '<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Minha página</title>\n</head>\n<body>\n  <!-- Escreva o conteúdo da página -->\n</body>\n</html>',
              verificacoes: [
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'html',
                  atributo: 'lang',
                  valor: 'pt-BR',
                },
                {
                  tipo: 'HTML_ELEMENT',
                  tag: 'title',
                  texto: 'Aprendendo HTML',
                },
                {
                  tipo: 'HTML_ELEMENT',
                  tag: 'h1',
                  texto: 'Minha primeira página',
                },
              ],
            },
          },
        ],
      },
      {
        titulo: 'Textos, links e imagens',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual elemento representa o título principal de uma página?',
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
            enunciado:
              'Qual atributo de img fornece uma descrição alternativa da imagem?',
            explicacao:
              'O atributo alt fornece texto alternativo, útil para acessibilidade e quando a imagem não pode ser carregada.',
            pontos: 10,
            opcoes: [
              { texto: 'alt', correta: true },
              { texto: 'href' },
              { texto: 'target' },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Crie um link para a documentação do HTML e uma imagem com texto alternativo.',
            explicacao:
              'O href define o destino do link. Imagens informativas precisam do atributo alt para que leitores de tela descrevam seu conteúdo.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'html',
              orientacao:
                'Escreva os elementos dentro do body. O endereço da imagem pode ser um caminho de exemplo.',
              codigoInicial: '<body>\n  \n</body>',
              verificacoes: [
                {
                  tipo: 'HTML_ELEMENT',
                  tag: 'a',
                  texto: 'Documentação HTML',
                },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'a',
                  atributo: 'href',
                  valor: 'https://developer.mozilla.org/',
                },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'img',
                  atributo: 'alt',
                  valor: 'Logotipo do projeto',
                },
              ],
            },
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual elemento HTML associa um texto a um campo de formulário?',
            explicacao:
              'O elemento label identifica o campo e pode ser associado a ele pelo atributo for.',
            pontos: 10,
            opcoes: [
              { texto: '<label>', correta: true },
              { texto: '<section>' },
              { texto: '<strong>' },
            ],
          },
        ],
      },
      {
        titulo: 'Formulários e acessibilidade',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Por que um campo de formulário deve ter um label?',
            explicacao:
              'O label informa a finalidade do campo e melhora a navegação por tecnologias assistivas.',
            pontos: 10,
            opcoes: [
              {
                texto:
                  'Para identificar o campo, inclusive para leitores de tela.',
                correta: true,
              },
              { texto: 'Para mudar a cor do campo.' },
              { texto: 'Para substituir o formulário.' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado:
              'Ordene os elementos para montar um formulário com rótulo e botão.',
            explicacao:
              'O formulário agrupa os campos; o label descreve a entrada e o button permite enviar.',
            pontos: 10,
            opcoes: [
              { texto: '<form>', posicaoCorreta: 1 },
              { texto: '<label for="email">E-mail</label>', posicaoCorreta: 2 },
              { texto: '<input id="email" type="email">', posicaoCorreta: 3 },
              {
                texto: '<button type="submit">Enviar</button>',
                posicaoCorreta: 4,
              },
              { texto: '</form>', posicaoCorreta: 5 },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Escreva um formulário de contato com label associado ao campo de nome e um botão de envio.',
            explicacao:
              'Associe label e input usando o mesmo identificador em for e id. Use type="text" e um botão submit.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'html',
              orientacao:
                'Use os elementos form, label, input e button. O campo deve se chamar nome.',
              codigoInicial: '<form>\n  \n</form>',
              verificacoes: [
                { tipo: 'HTML_ELEMENT', tag: 'form', texto: '' },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'label',
                  atributo: 'for',
                  valor: 'nome',
                },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'input',
                  atributo: 'id',
                  valor: 'nome',
                },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'input',
                  atributo: 'type',
                  valor: 'text',
                },
                {
                  tipo: 'HTML_ATTRIBUTE',
                  tag: 'button',
                  atributo: 'type',
                  valor: 'submit',
                },
              ],
            },
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual elemento representa o conteúdo principal de uma página?',
            explicacao:
              'O elemento main identifica o conteúdo dominante e único daquela página.',
            pontos: 10,
            opcoes: [
              { texto: '<main>', correta: true },
              { texto: '<small>' },
              { texto: '<br>' },
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
            enunciado:
              'Qual declaração aumenta o tamanho da fonte para 20 pixels?',
            explicacao:
              'font-size controla o tamanho da fonte; 20px define vinte pixels.',
            pontos: 10,
            opcoes: [
              { texto: 'font-size: 20px;', correta: true },
              { texto: 'color: 20px;' },
              { texto: 'background-color: 20px;' },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Escreva regras para deixar o título azul e os parágrafos com fonte de 18 pixels.',
            explicacao:
              'Seletores de elemento como h1 e p aplicam estilos a todas as tags correspondentes. color altera o texto e font-size seu tamanho.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'css',
              orientacao:
                'Escreva duas regras CSS. Espaços e quebras de linha não alteram a correção.',
              codigoInicial: '/* Estilize o título e os parágrafos */\n',
              verificacoes: [
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: 'h1',
                  propriedade: 'color',
                  valor: 'blue',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: 'p',
                  propriedade: 'font-size',
                  valor: '18px',
                },
              ],
            },
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
            enunciado:
              'Ordene os trechos para aplicar cor de texto e cor de fundo.',
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
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Estilize o cartão .aviso com texto branco, fundo azul-marinho e espaçamento interno de 16 pixels.',
            explicacao:
              'O ponto seleciona uma classe. As propriedades color, background-color e padding controlam texto, fundo e espaço interno.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'css',
              orientacao:
                'Crie uma única regra para a classe aviso e inclua as três declarações.',
              codigoInicial: '/* Estilize o aviso */\n',
              verificacoes: [
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.aviso',
                  propriedade: 'color',
                  valor: 'white',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.aviso',
                  propriedade: 'background-color',
                  valor: 'navy',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.aviso',
                  propriedade: 'padding',
                  valor: '16px',
                },
              ],
            },
          },
        ],
      },
      {
        titulo: 'Seletores e classes',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual seletor CSS seleciona elementos com class="destaque"?',
            explicacao:
              'Classes são selecionadas com ponto seguido do nome da classe.',
            pontos: 10,
            opcoes: [
              { texto: '.destaque', correta: true },
              { texto: '#destaque' },
              { texto: 'destaque()' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado: 'Ordene os trechos para estilizar a classe botao.',
            explicacao:
              'O seletor de classe começa com ponto e as declarações ficam entre chaves.',
            pontos: 10,
            opcoes: [
              { texto: '.botao {', posicaoCorreta: 1 },
              { texto: 'color: white;', posicaoCorreta: 2 },
              { texto: 'background-color: green;', posicaoCorreta: 3 },
              { texto: '}', posicaoCorreta: 4 },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Crie uma regra para a classe .cartao com fundo branco, espaçamento interno de 24 pixels e cantos arredondados.',
            explicacao:
              'Use background-color, padding e border-radius na regra da classe .cartao.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'css',
              orientacao: 'Escreva uma regra CSS para o cartão.',
              codigoInicial: '/* Estilize o cartão */\n',
              verificacoes: [
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.cartao',
                  propriedade: 'background-color',
                  valor: 'white',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.cartao',
                  propriedade: 'padding',
                  valor: '24px',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.cartao',
                  propriedade: 'border-radius',
                  valor: '12px',
                },
              ],
            },
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Qual é a diferença entre #menu e .menu em CSS?',
            explicacao:
              'O símbolo # seleciona um id; o ponto seleciona uma classe.',
            pontos: 10,
            opcoes: [
              { texto: '# seleciona id e . seleciona classe.', correta: true },
              { texto: 'Os dois selecionam somente tags HTML.' },
              { texto: '. seleciona id e # seleciona classe.' },
            ],
          },
        ],
      },
      {
        titulo: 'Modelo de caixa e espaçamento',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual propriedade cria espaço interno entre o conteúdo e a borda?',
            explicacao:
              'padding cria espaço interno; margin cria espaço externo ao elemento.',
            pontos: 10,
            opcoes: [
              { texto: 'padding', correta: true },
              { texto: 'margin' },
              { texto: 'font-family' },
            ],
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado:
              'Ordene as declarações para remover a margem e adicionar espaço interno.',
            explicacao:
              'As declarações CSS são escritas como propriedade, dois-pontos, valor e ponto e vírgula.',
            pontos: 10,
            opcoes: [
              { texto: '.painel {', posicaoCorreta: 1 },
              { texto: 'margin: 0;', posicaoCorreta: 2 },
              { texto: 'padding: 20px;', posicaoCorreta: 3 },
              { texto: '}', posicaoCorreta: 4 },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Defina box-sizing: border-box para todos os elementos usando o seletor universal.',
            explicacao:
              'O seletor * representa todos os elementos. border-box inclui padding e borda no tamanho declarado.',
            pontos: 20,
            opcoes: [],
            conteudo: {
              linguagem: 'css',
              orientacao:
                'Escreva uma regra CSS global com o seletor universal.',
              codigoInicial: '/* Ajuste o modelo de caixa */\n',
              verificacoes: [
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '*',
                  propriedade: 'box-sizing',
                  valor: 'border-box',
                },
              ],
            },
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual propriedade adiciona espaço externo ao redor de um elemento?',
            explicacao: 'margin controla o espaço fora da borda do elemento.',
            pontos: 10,
            opcoes: [
              { texto: 'margin', correta: true },
              { texto: 'padding' },
              { texto: 'border-color' },
            ],
          },
        ],
      },
      {
        titulo: 'Layout responsivo',
        desafios: [
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado: 'Para que serve uma media query?',
            explicacao:
              'Media queries aplicam estilos conforme características do dispositivo, como a largura da tela.',
            pontos: 10,
            opcoes: [
              {
                texto: 'Adaptar estilos a diferentes condições de tela.',
                correta: true,
              },
              { texto: 'Criar conteúdo HTML.' },
              { texto: 'Armazenar dados do usuário.' },
            ],
          },
          {
            tipo: TipoDesafio.ESCRITA_CODIGO,
            enunciado:
              'Em telas de até 600 pixels, organize .container em coluna usando flexbox.',
            explicacao:
              'Use uma media query max-width e, dentro dela, defina display: flex e flex-direction: column para .container.',
            pontos: 25,
            opcoes: [],
            conteudo: {
              linguagem: 'css',
              orientacao:
                'Escreva a regra responsiva. O editor verifica a condição da media query e as propriedades.',
              codigoInicial: '/* Adapte o layout para telas pequenas */\n',
              verificacoes: [
                {
                  tipo: 'CSS_MEDIA_QUERY',
                  condicao: '(max-width: 600px)',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.container',
                  propriedade: 'display',
                  valor: 'flex',
                },
                {
                  tipo: 'CSS_DECLARATION',
                  seletor: '.container',
                  propriedade: 'flex-direction',
                  valor: 'column',
                },
              ],
            },
          },
          {
            tipo: TipoDesafio.ORDENACAO,
            enunciado:
              'Ordene os trechos para criar uma media query para celular.',
            explicacao:
              'A condição da media query vem antes das regras que devem valer naquela largura de tela.',
            pontos: 10,
            opcoes: [
              { texto: '@media (max-width: 600px) {', posicaoCorreta: 1 },
              {
                texto: '.container { flex-direction: column; }',
                posicaoCorreta: 2,
              },
              { texto: '}', posicaoCorreta: 3 },
            ],
          },
          {
            tipo: TipoDesafio.ESCOLHA_UNICA,
            enunciado:
              'Qual unidade CSS é relativa ao tamanho da fonte do elemento raiz?',
            explicacao:
              'rem é relativo ao tamanho da fonte do elemento raiz; px é uma unidade fixa.',
            pontos: 10,
            opcoes: [
              { texto: 'rem', correta: true },
              { texto: 'px' },
              { texto: 'ptag' },
            ],
          },
        ],
      },
    ],
  },
];

async function seedContent() {
  await prisma.$transaction(
    async (transaction) => {
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
          where: {
            trilhaId_ordem: { trilhaId: trilha.id, ordem: moduleIndex + 1 },
          },
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

          for (const [
            challengeIndex,
            challengeSeed,
          ] of lessonSeed.desafios.entries()) {
            const existing = await transaction.desafio.findFirst({
              where: { licaoId: licao.id, ordem: challengeIndex + 1 },
              select: { id: true },
            });
            const challengeData = {
              tipo: challengeSeed.tipo,
              enunciado: challengeSeed.enunciado,
              explicacao: challengeSeed.explicacao,
              conteudo: challengeSeed.conteudo ?? Prisma.JsonNull,
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
    },
    { maxWait: 15_000, timeout: 60_000 },
  );
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
