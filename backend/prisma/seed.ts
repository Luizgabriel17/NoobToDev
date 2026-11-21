import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Papel,
  Prisma,
  PrismaClient,
  TipoDesafio,
  TipoLicao,
} from '@prisma/client';
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

type CheckSeed =
  | { tipo: 'HTML_ELEMENT'; tag: string; texto: string }
  | { tipo: 'HTML_ATTRIBUTE'; tag: string; atributo: string; valor: string }
  | {
      tipo: 'CSS_DECLARATION';
      seletor: string;
      propriedade: string;
      valor: string;
    }
  | { tipo: 'CSS_MEDIA_QUERY'; condicao: string }
  | { tipo: 'JS_DECLARATION'; nome: string; especie: 'const' | 'let' }
  | { tipo: 'JS_FUNCTION'; nome: string }
  | { tipo: 'JS_ARRAY_METHOD'; metodo: 'map' | 'filter' | 'find' };

type ChallengeSeed = {
  tipo: TipoDesafio;
  enunciado: string;
  explicacao: string;
  dica: string;
  pontos: number;
  opcoes: OptionSeed[];
  conteudo?: Prisma.InputJsonValue;
  revisaoDe?: string;
};

type LessonSeed = {
  titulo: string;
  tipo?: TipoLicao;
  publicada?: boolean;
  explicacao: string;
  exemploCodigo?: string;
  exemploResultado?: string;
  desafios?: ChallengeSeed[];
  revisaoDe?: string[];
};

type ModuleSeed = { titulo: string; licoes: LessonSeed[] };

const choice = (
  enunciado: string,
  explicacao: string,
  dica: string,
  alternativas: string[],
  correta = 0,
  tipo = TipoDesafio.ESCOLHA_UNICA,
): ChallengeSeed => ({
  tipo,
  enunciado,
  explicacao,
  dica,
  pontos: 10,
  opcoes: alternativas.map((texto, index) => ({
    texto,
    correta: index === correta,
  })),
});

const ordering = (
  enunciado: string,
  explicacao: string,
  dica: string,
  blocos: string[],
): ChallengeSeed => ({
  tipo: TipoDesafio.ORDENACAO,
  enunciado,
  explicacao,
  dica,
  pontos: 10,
  opcoes: blocos.map((texto, index) => ({
    texto,
    posicaoCorreta: index + 1,
  })),
});

const blank = (
  enunciado: string,
  explicacao: string,
  dica: string,
  codigoInicial: string,
  respostasAceitas: string[],
): ChallengeSeed => ({
  tipo: TipoDesafio.COMPLETAR_LACUNAS,
  enunciado,
  explicacao,
  dica,
  pontos: 15,
  opcoes: [],
  conteudo: {
    orientacao: enunciado,
    codigoInicial,
    respostasAceitas,
  },
});

const code = (
  enunciado: string,
  explicacao: string,
  dica: string,
  linguagem: 'html' | 'css' | 'javascript',
  codigoInicial: string,
  verificacoes: CheckSeed[],
): ChallengeSeed => ({
  tipo: TipoDesafio.ESCRITA_CODIGO,
  enunciado,
  explicacao,
  dica,
  pontos: 25,
  opcoes: [],
  conteudo: {
    linguagem,
    orientacao: enunciado,
    codigoInicial: decodeNewlines(codigoInicial),
    verificacoes,
  },
});

function decodeNewlines(value: string): string {
  return value.replaceAll('\\n', '\n');
}

const htmlElement = (tag: string, texto: string): CheckSeed => ({
  tipo: 'HTML_ELEMENT',
  tag,
  texto,
});

const htmlAttribute = (
  tag: string,
  atributo: string,
  valor: string,
): CheckSeed => ({ tipo: 'HTML_ATTRIBUTE', tag, atributo, valor });

const css = (
  seletor: string,
  propriedade: string,
  valor: string,
): CheckSeed => ({ tipo: 'CSS_DECLARATION', seletor, propriedade, valor });

const jsVariable = (
  nome: string,
  especie: 'const' | 'let' = 'const',
): CheckSeed => ({ tipo: 'JS_DECLARATION', nome, especie });

const jsFunction = (nome: string): CheckSeed => ({
  tipo: 'JS_FUNCTION',
  nome,
});

const jsMethod = (metodo: 'map' | 'filter' | 'find'): CheckSeed => ({
  tipo: 'JS_ARRAY_METHOD',
  metodo,
});

const lesson = (
  titulo: string,
  explicacao: string,
  exemploCodigo: string,
  exemploResultado: string,
  desafios: ChallengeSeed[],
): LessonSeed => ({
  titulo,
  explicacao,
  exemploCodigo: decodeNewlines(exemploCodigo),
  exemploResultado,
  desafios,
});

const review = (revisaoDe: string[]): LessonSeed => ({
  titulo: 'Revisão espaçada',
  tipo: TipoLicao.REVISAO,
  explicacao:
    'Esta revisão traz de volta questões de lições anteriores para ajudar a lembrar do que você já estudou.\n\nTente responder sem consultar as explicações. Se errar, releia a dica e use a tentativa para descobrir qual ideia precisa revisar.\n\nRevisitar conceitos em momentos diferentes ajuda a fixá-los e mostra como os assuntos se conectam.',
  exemploCodigo: '// Relembre os exemplos das lições anteriores.',
  exemploResultado: 'Conceitos revisitados e conectados.',
  revisaoDe,
});

const project = (
  titulo: string,
  explicacao: string,
  exemploCodigo: string,
  exemploResultado: string,
  desafios: ChallengeSeed[],
): LessonSeed => ({
  titulo,
  tipo: TipoLicao.PROJETO,
  explicacao,
  exemploCodigo: decodeNewlines(exemploCodigo),
  exemploResultado,
  desafios,
});

const modules: ModuleSeed[] = [
  {
    titulo: 'HTML essencial',
    licoes: [
      lesson(
        'Estrutura do documento, títulos e parágrafos',
        'HTML organiza o conteúdo da página usando elementos, escritos entre sinais de menor e maior. A maioria tem uma abertura e um fechamento, que envolvem o conteúdo.\n\nO documento começa com doctype e html. O head guarda informações da página; o body contém o que aparece para a pessoa. Títulos h1 a h6 organizam assuntos, e p marca parágrafos.\n\nNo exemplo, lang informa o idioma, title nomeia a aba e h1 apresenta o assunto principal. O comentário explica cada parte sem aparecer no conteúdo da página.',
        '<!doctype html>\\n<html lang="pt-BR">\\n<head>\\n  <meta charset="UTF-8">\\n  <title>Meu diário</title>\\n</head>\\n<body>\\n  <!-- Assunto principal da página -->\\n  <h1>Meu diário de código</h1>\\n  <p>Hoje criei minha primeira página.</p>\\n</body>\\n</html>',
        'A página mostra “Meu diário de código” como título principal e, abaixo, um parágrafo.',
        [
          choice(
            'Qual parte do documento contém o conteúdo exibido na página?',
            'O body guarda o conteúdo apresentado na área da página. O head guarda metadados e referências a recursos.',
            'Pense em qual elemento representa o corpo visível do documento.',
            ['<body>', '<head>', '<title>'],
          ),
          ordering(
            'Organize a estrutura mínima para colocar um parágrafo no documento.',
            'O conteúdo visível fica no body, dentro do elemento html.',
            'O elemento mais externo deve envolver o documento todo.',
            [
              '<html lang="pt-BR">',
              '<body>',
              '<p>Olá!</p>',
              '</body>',
              '</html>',
            ],
          ),
          blank(
            'Complete com o elemento que representa um parágrafo.',
            'O elemento p envolve um bloco de texto que forma um parágrafo.',
            'A tag começa com a letra p.',
            '<___>Estou aprendendo.</p>',
            ['p'],
          ),
          choice(
            'Encontre o erro: qual opção usa corretamente um título principal e um parágrafo?',
            'Títulos são marcados com h1 a h6 e parágrafos com p; os nomes precisam estar entre sinais de menor e maior.',
            'Observe se cada elemento abre e fecha com o mesmo nome.',
            [
              '<h1>Olá</h1><p>Bem-vinda.</p>',
              '<h1>Olá<p>Bem-vinda.</h1>',
              '<titulo>Olá</titulo>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie um título “Minha primeira página” dentro do body.',
            'h1 é o título de maior nível e deve envolver o texto que será apresentado.',
            'Use uma tag de abertura e outra de fechamento com o mesmo nome.',
            'html',
            '<body>\\n  <!-- Adicione o título principal -->\\n</body>',
            [htmlElement('h1', 'Minha primeira página')],
          ),
        ],
      ),
      lesson(
        'Listas, links e imagens',
        'Uma lista não ordenada usa ul; cada item fica em li. Para passos cuja ordem importa, ol usa números automaticamente.\n\nLinks usam a para envolver o texto clicável. O atributo href indica o destino. Imagens usam img e não precisam de tag de fechamento; seu endereço fica em src.\n\nEscreva alt em toda imagem informativa. Esse texto descreve a imagem para quem não consegue vê-la e para tecnologias assistivas. No exemplo, o link leva a uma página e a imagem tem uma descrição útil.',
        '<!-- Uma lista e um link ajudam a navegar pelo conteúdo. -->\\n<ul>\\n  <li>Aprender HTML</li>\\n  <li>Praticar todo dia</li>\\n</ul>\\n<a href="https://developer.mozilla.org/">Ler a documentação</a>\\n<img src="livro.jpg" alt="Livro aberto sobre uma mesa">',
        'Uma lista com dois itens, um link “Ler a documentação” e uma imagem descrita.',
        [
          choice(
            'Qual atributo indica o endereço para onde um link leva?',
            'href guarda o endereço de destino do link.',
            'Procure o atributo que acompanha o elemento a.',
            ['href', 'alt', 'src'],
          ),
          ordering(
            'Monte um link que leve à página inicial da MDN.',
            'O elemento a envolve o texto clicável; href fica na abertura.',
            'O endereço fica no atributo do elemento que abre primeiro.',
            ['<a href="https://developer.mozilla.org/">', 'Abrir MDN', '</a>'],
          ),
          blank(
            'Complete o atributo que descreve uma imagem para leitores de tela.',
            'alt fornece um texto alternativo para uma imagem informativa.',
            'O nome tem três letras e começa com a.',
            '<img src="gato.jpg" ___="Gato dormindo no sofá">',
            ['alt'],
          ),
          choice(
            'Encontre o erro: qual imagem tem descrição e qual link tem destino?',
            'A imagem usa src e alt; o link usa href. Cada atributo tem uma finalidade própria.',
            'Confira se a descrição está na imagem e o endereço no link.',
            [
              '<a href="/ajuda">Ajuda</a><img src="mapa.png" alt="Mapa do bairro">',
              '<a alt="/ajuda">Ajuda</a><img href="mapa.png">',
              '<a src="/ajuda">Ajuda</a><img alt="Mapa">',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: escreva um link para a MDN e uma imagem com texto alternativo.',
            'Links precisam de href e texto; imagens informativas precisam de src e alt.',
            'Inclua a palavra “Documentação” no link e dê um alt que descreva a imagem.',
            'html',
            '<body>\\n  <!-- Adicione o link e a imagem -->\\n</body>',
            [
              htmlAttribute('a', 'href', 'https://developer.mozilla.org/'),
              htmlElement('a', 'Documentação'),
              htmlAttribute('img', 'alt', 'Livro de HTML'),
            ],
          ),
        ],
      ),
      lesson(
        'Formulários e campos acessíveis',
        'Formulários permitem receber informações. O elemento form agrupa os campos e o botão que envia esses dados.\n\nUse label para dar nome a cada campo. O valor de for no label deve ser igual ao id do input ou select relacionado. Assim, clicar no rótulo também foca o campo.\n\nEscolha o tipo de input adequado, como email para endereço de e-mail. Use button com type="submit" para enviar. Um formulário bem identificado é mais fácil de usar com teclado e leitor de tela.',
        '<form>\\n  <!-- for e id conectam o rótulo ao campo -->\\n  <label for="email">Seu e-mail</label>\\n  <input id="email" name="email" type="email">\\n  <button type="submit">Enviar</button>\\n</form>',
        'Um campo identificado como “Seu e-mail” e um botão “Enviar”.',
        [
          choice(
            'Para que serve associar label e input pelo mesmo identificador?',
            'A associação torna o nome do campo disponível para tecnologias assistivas e permite focar o campo pelo rótulo.',
            'Pense em quem precisa descobrir a finalidade de cada campo.',
            [
              'Identificar o campo para todas as pessoas e tecnologias assistivas.',
              'Mudar a cor do botão automaticamente.',
              'Tornar o campo obrigatório sem atributo adicional.',
            ],
          ),
          ordering(
            'Organize um campo de nome com rótulo associado e botão.',
            'O label aponta para o id do input; os controles ficam dentro do form.',
            'O formulário envolve primeiro os controles.',
            [
              '<form>',
              '<label for="nome">Nome</label>',
              '<input id="nome" name="nome" type="text">',
              '<button type="submit">Enviar</button>',
              '</form>',
            ],
          ),
          blank(
            'Complete o atributo do label que aponta para o id do campo.',
            'O atributo for associa o rótulo ao elemento que tem o mesmo id.',
            'O atributo em inglês quer dizer “para”.',
            '<label ___="nome">Seu nome</label><input id="nome">',
            ['for'],
          ),
          choice(
            'Encontre o erro: qual campo tem um rótulo corretamente associado?',
            'Os valores de for e id precisam ser iguais, inclusive nas letras.',
            'Compare os dois identificadores caractere por caractere.',
            [
              '<label for="cidade">Cidade</label><select id="cidade"></select>',
              '<label for="email">E-mail</label><input id="nome">',
              '<label>E-mail</label><input id="email">',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: monte um formulário de contato com campo de nome acessível e botão.',
            'O label deve apontar para o campo pelo mesmo identificador; o botão precisa ser do tipo submit.',
            'Use form, label, input e button. Repita “nome” em for e id.',
            'html',
            '<form>\\n  <!-- Crie um campo e um botão -->\\n</form>',
            [
              htmlElement('form', ''),
              htmlElement('label', 'Nome'),
              htmlAttribute('label', 'for', 'nome'),
              htmlAttribute('input', 'id', 'nome'),
              htmlAttribute('button', 'type', 'submit'),
            ],
          ),
        ],
      ),
      lesson(
        'Listas e tabelas de dados',
        'Use ul para uma lista sem ordem e ol para uma sequência em que a posição importa. Cada item deve ficar dentro de li.\n\nTabelas são para dados organizados em linhas e colunas, não para montar o layout da página. table envolve a tabela; tr cria uma linha, th nomeia uma coluna e td apresenta um valor.\n\nNo exemplo, caption explica o assunto da tabela. Cabeçalhos com th deixam claro o que cada coluna significa, inclusive para tecnologias assistivas.',
        '<!-- Use listas para itens e tabelas para comparar dados. -->\\n<ol>\\n  <li>Planejar</li>\\n  <li>Construir</li>\\n</ol>\\n<table>\\n  <caption>Horas de estudo</caption>\\n  <tr><th>Dia</th><th>Horas</th></tr>\\n  <tr><td>Segunda</td><td>1</td></tr>\\n</table>',
        'Uma lista numerada e uma tabela com os cabeçalhos “Dia” e “Horas”.',
        [
          choice(
            'Qual elemento marca uma célula de cabeçalho em uma tabela?',
            'th identifica o cabeçalho de uma coluna ou linha; td marca uma célula de dados.',
            'A letra h lembra “heading”, isto é, cabeçalho.',
            ['<th>', '<td>', '<li>'],
          ),
          ordering(
            'Organize uma linha com um cabeçalho e uma célula de dado.',
            'tr cria uma linha; dentro dela, th e td representam cabeçalho e dado.',
            'Uma linha de tabela começa com tr.',
            ['<tr>', '<th>Curso</th>', '<td>HTML</td>', '</tr>'],
          ),
          blank(
            'Complete o elemento que contém cada item de uma lista.',
            'li representa um item; ele fica dentro de ul ou ol.',
            'O nome tem duas letras e começa com l.',
            '<ul><___>Maçã</li></ul>',
            ['li'],
          ),
          choice(
            'Encontre o erro: qual trecho usa cabeçalhos e células de dados?',
            'Cabeçalhos usam th e valores comuns usam td, dentro de uma linha tr.',
            'Confira se os nomes dos elementos descrevem corretamente cada célula.',
            [
              '<tr><th>Nome</th><td>Ana</td></tr>',
              '<tr><td>Nome</th><th>Ana</td></tr>',
              '<ul><tr><th>Nome</th></tr></ul>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma tabela de produtos com cabeçalho e uma linha de dados.',
            'Uma tabela básica usa table, uma linha tr, cabeçalhos th e dados td.',
            'Inclua um cabeçalho “Produto” e um valor “Caderno”.',
            'html',
            '<!-- Crie a tabela de produtos -->',
            [
              htmlElement('table', ''),
              htmlElement('th', 'Produto'),
              htmlElement('td', 'Caderno'),
            ],
          ),
        ],
      ),
      review(['1:1:1', '1:2:1', '1:3:1', '1:4:1']),
      project(
        'Projeto: página de perfil',
        'Agora você vai combinar a estrutura HTML, textos, imagem, link, lista e formulário em uma página de perfil.\n\nPlaneje primeiro o conteúdo: uma apresentação, algumas habilidades, um contato e um campo para receber uma mensagem. Use elementos cujo nome explique o papel de cada parte.\n\nConfira se a imagem tem texto alternativo e se o campo tem um rótulo associado. O projeto é um ponto de partida que você poderá melhorar nos módulos seguintes.',
        '<!-- Perfil feito com HTML semântico e acessível. -->\\n<main>\\n  <h1>Olá, sou Alex</h1>\\n  <img src="perfil.jpg" alt="Alex sorrindo">\\n  <p>Estou aprendendo desenvolvimento web.</p>\\n  <ul><li>HTML</li><li>Curiosidade</li></ul>\\n  <a href="mailto:alex@example.com">Fale comigo</a>\\n</main>',
        'Uma apresentação com imagem descrita, habilidades e link para contato.',
        [
          choice(
            'Qual atributo não pode faltar em uma imagem informativa do perfil?',
            'alt comunica o conteúdo da imagem a quem não pode vê-la.',
            'Escolha o atributo usado para uma descrição textual.',
            ['alt', 'href', 'for'],
          ),
          ordering(
            'Organize os elementos para apresentar uma pessoa com um título e uma descrição.',
            'O título e o parágrafo ficam no conteúdo principal do documento.',
            'O conteúdo principal pode envolver os elementos.',
            [
              '<main>',
              '<h1>Olá, sou Alex</h1>',
              '<p>Aprendo desenvolvimento web.</p>',
              '</main>',
            ],
          ),
          blank(
            'Complete o atributo que conecta o rótulo do contato ao campo.',
            'for e id compartilham o mesmo valor para identificar o campo.',
            'Use o mesmo identificador que está no id do input.',
            '<label ___="mensagem">Mensagem</label><input id="mensagem">',
            ['for'],
          ),
          choice(
            'Encontre o erro: qual combinação cria uma imagem descrita e um contato navegável?',
            'src identifica a imagem, alt a descreve e href indica o destino do link.',
            'Cada atributo deve ficar no elemento que o utiliza.',
            [
              '<img src="perfil.jpg" alt="Alex"><a href="mailto:alex@example.com">Contato</a>',
              '<img href="perfil.jpg"><a alt="Contato">Abrir</a>',
              '<img src="perfil.jpg"><a src="mailto:alex@example.com">Contato</a>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Desafio do projeto: crie um perfil com título, imagem descrita, lista de habilidades e link de contato.',
            'Combine os elementos praticados. As verificações aceitam diferentes espaços e organização do HTML.',
            'Use h1, img com alt, uma lista e um link com href.',
            'html',
            '<main>\\n  <!-- Monte seu perfil -->\\n</main>',
            [
              htmlElement('h1', 'Alex'),
              htmlAttribute('img', 'alt', 'Alex sorrindo'),
              htmlElement('li', 'HTML'),
              htmlAttribute('a', 'href', 'mailto:alex@example.com'),
            ],
          ),
        ],
      ),
    ],
  },
  {
    titulo: 'HTML semântico',
    licoes: [
      lesson(
        'O que significa HTML semântico',
        'Semântica é o significado de cada parte do conteúdo. HTML semântico usa elementos que descrevem sua função, em vez de escolher tags apenas pela aparência.\n\nUm navegador e tecnologias assistivas entendem melhor uma página que indica onde está a navegação, o conteúdo principal e os artigos. Isso também ajuda mecanismos de busca a interpretar a organização.\n\nNo exemplo, main marca o assunto central e article envolve um texto que faz sentido por conta própria. O CSS poderá mudar a aparência sem tirar esse significado.',
        '<!-- Os nomes dos elementos explicam o papel de cada área. -->\\n<main>\\n  <article>\\n    <h1>Como comecei a programar</h1>\\n    <p>Meu primeiro passo foi escrever HTML.</p>\\n  </article>\\n</main>',
        'Um artigo com título e parágrafo na região principal.',
        [
          choice(
            'Por que preferir elementos semânticos a várias div sem significado?',
            'Elementos semânticos dão contexto às pessoas, aos navegadores e às tecnologias assistivas.',
            'Pense no que o nome de cada elemento comunica.',
            [
              'Eles comunicam a função das partes da página.',
              'Eles adicionam estilos e cores automaticamente.',
              'Eles substituem todo o CSS.',
            ],
          ),
          ordering(
            'Organize uma página com cabeçalho e conteúdo principal.',
            'header apresenta a página; main envolve o conteúdo principal.',
            'Cada região deve envolver seus próprios elementos.',
            [
              '<header><h1>Meu site</h1></header>',
              '<main><p>Conteúdo principal</p></main>',
            ],
          ),
          blank(
            'Complete com o elemento que marca o conteúdo principal único da página.',
            'main destaca o assunto central do documento.',
            'O nome em inglês significa “principal”.',
            '<___><h1>Notícias</h1></main>',
            ['main'],
          ),
          choice(
            'Encontre o erro: qual estrutura deixa claro qual é o conteúdo principal?',
            'Uma página deve ter um main identificável contendo o conteúdo dominante.',
            'Procure o elemento que corresponde à área principal.',
            [
              '<main><article><h1>Notícia</h1></article></main>',
              '<main><main><h1>Notícia</h1></main></main>',
              '<article><main><h1>Notícia</h1></main></article>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: coloque um artigo com título “Meu primeiro projeto” na área principal.',
            'main representa o assunto principal e article um conteúdo independente.',
            'Crie um h1 dentro de article e mantenha ambos dentro de main.',
            'html',
            '<!-- Escreva a estrutura semântica -->',
            [
              htmlElement('main', ''),
              htmlElement('article', ''),
              htmlElement('h1', 'Meu primeiro projeto'),
            ],
          ),
        ],
      ),
      lesson(
        'Cabeçalho e navegação',
        'header apresenta uma página ou uma seção. Ele pode conter a marca, um título ou informações introdutórias.\n\nnav reúne links importantes de navegação. Os links devem ter textos claros, para que a pessoa entenda o destino antes de clicar.\n\nA posição visual pode ser alterada com CSS, mas os elementos continuam descrevendo a função do conteúdo. No exemplo, o cabeçalho apresenta o site e nav agrupa seus caminhos.',
        '<!-- O cabeçalho apresenta o site e nav agrupa seus caminhos. -->\\n<header>\\n  <a href="/">Meu espaço</a>\\n  <nav aria-label="Navegação principal">\\n    <a href="/sobre">Sobre</a>\\n    <a href="/contato">Contato</a>\\n  </nav>\\n</header>',
        'Um cabeçalho com a marca e navegação para “Sobre” e “Contato”.',
        [
          choice(
            'Qual elemento agrupa links de navegação importantes?',
            'nav dá nome à região que contém links de navegação.',
            'Pense no elemento cuja abreviação aparece na palavra navegação.',
            ['<nav>', '<footer>', '<article>'],
          ),
          ordering(
            'Organize um cabeçalho com uma navegação interna.',
            'header contém o conteúdo de apresentação; nav agrupa os links.',
            'O elemento que apresenta a página vem por fora.',
            [
              '<header>',
              '<nav><a href="/inicio">Início</a></nav>',
              '</header>',
            ],
          ),
          blank(
            'Complete o elemento que apresenta um cabeçalho de página.',
            'header identifica o cabeçalho da página ou de uma seção.',
            'O nome em inglês lembra a palavra “cabeça”.',
            '<___><h1>Meu site</h1></header>',
            ['header'],
          ),
          choice(
            'Encontre o erro: qual navegação tem uma descrição acessível?',
            'aria-label pode dar um nome à região quando seus links não bastam para identificá-la.',
            'Veja se o rótulo está no elemento que agrupa a navegação.',
            [
              '<nav aria-label="Navegação principal"><a href="/">Início</a></nav>',
              '<a aria-label="Navegação"><nav href="/">Início</nav></a>',
              '<nav><a href="/">Clique aqui para tudo</a></nav>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie um cabeçalho com navegação principal e links Início e Sobre.',
            'Use header para apresentar e nav para agrupar os links com destinos claros.',
            'Inclua um link para / e outro para /sobre.',
            'html',
            '<!-- Cabeçalho do site -->',
            [
              htmlElement('header', ''),
              htmlElement('nav', ''),
              htmlAttribute('a', 'href', '/sobre'),
              htmlElement('a', 'Sobre'),
            ],
          ),
        ],
      ),
      lesson(
        'Seções, artigos e rodapé',
        'section agrupa conteúdo relacionado que normalmente tem um título. Use-o para dividir uma página em assuntos compreensíveis.\n\narticle representa um conteúdo independente, como uma notícia ou publicação. Pode fazer sentido mesmo quando é compartilhado separado do resto da página.\n\nfooter traz informações finais da página ou da seção, como autoria ou formas de contato. Escolha cada elemento pelo papel do conteúdo; não pelo formato ou cor que deseja obter.',
        '<!-- Seções agrupam assuntos e artigos podem ser lidos por conta própria. -->\\n<main>\\n  <section aria-labelledby="novidade">\\n    <h2 id="novidade">Novidades</h2>\\n    <article><h3>Curso aberto</h3><p>Inscrições disponíveis.</p></article>\\n  </section>\\n</main>\\n<footer><p>Feito para aprender.</p></footer>',
        'Uma seção “Novidades”, um artigo e um rodapé.',
        [
          choice(
            'Qual conteúdo combina melhor com article?',
            'Uma publicação que pode ser entendida fora do contexto da página é um artigo independente.',
            'Pergunte se o conteúdo ainda faria sentido se fosse compartilhado sozinho.',
            [
              'Uma notícia que pode ser compartilhada por conta própria.',
              'Um espaço vazio criado apenas para empurrar conteúdo.',
              'Uma regra para mudar a cor do texto.',
            ],
          ),
          ordering(
            'Organize uma seção com título e conteúdo relacionado.',
            'section agrupa um assunto e seu título o identifica.',
            'A seção deve envolver o título e o conteúdo relacionado.',
            [
              '<section>',
              '<h2>Eventos</h2>',
              '<p>Próximo encontro na sexta.</p>',
              '</section>',
            ],
          ),
          blank(
            'Complete o elemento que costuma agrupar informações finais da página.',
            'footer representa o rodapé de uma página ou de uma seção.',
            'O nome aparece em “rodapé” em inglês.',
            '<___><p>Contato e autoria</p></footer>',
            ['footer'],
          ),
          choice(
            'Encontre o erro: qual estrutura usa uma seção com título identificável?',
            'A seção deve conter o assunto e o título deve descrever esse assunto.',
            'Confira se o título está dentro da seção que ele nomeia.',
            [
              '<section><h2>Agenda</h2><p>Eventos do mês</p></section>',
              '<section></section><h2>Agenda</h2>',
              '<article><footer><main>Agenda</main></footer></article>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma seção “Projetos” com um artigo e um rodapé.',
            'Cada elemento descreve uma função diferente: assunto, publicação e fechamento.',
            'Use section, article, h2 e footer.',
            'html',
            '<main>\\n  <!-- Adicione a seção -->\\n</main>',
            [
              htmlElement('section', ''),
              htmlElement('h2', 'Projetos'),
              htmlElement('article', ''),
              htmlElement('footer', ''),
            ],
          ),
        ],
      ),
      lesson(
        'Boas práticas e SEO básico',
        'SEO é a sigla usada para falar de práticas que ajudam mecanismos de busca a entender uma página. Uma estrutura clara também melhora a navegação das pessoas.\n\nTenha um título de página específico, um h1 que explique o assunto e subtítulos em uma ordem lógica. Use textos de link que descrevam o destino, em vez de “clique aqui”.\n\nDefina o idioma com lang e escreva alt para imagens informativas. Esses cuidados não garantem uma posição nos resultados, mas deixam a página mais clara e acessível.',
        '<!-- Título, idioma e descrição deixam o documento mais claro. -->\\n<html lang="pt-BR">\\n<head>\\n  <title>Receitas simples para iniciantes</title>\\n  <meta name="description" content="Receitas fáceis para cozinhar em casa.">\\n</head>\\n<body>\\n  <main><h1>Receitas simples</h1><a href="/massas">Ver receitas de massa</a></main>\\n</body>\\n</html>',
        'A aba e o título principal descrevem a página, que tem link com destino compreensível.',
        [
          choice(
            'Qual texto de link ajuda melhor a entender seu destino?',
            'Um rótulo específico comunica o assunto antes mesmo de abrir a página.',
            'Prefira um texto que ainda faça sentido fora do parágrafo.',
            ['Ver receitas de massa', 'Clique aqui', 'Saiba mais'],
          ),
          ordering(
            'Organize idioma, título da aba e conteúdo principal.',
            'lang identifica o idioma do documento; title fica no head e o conteúdo no body.',
            'Comece pelo documento e separe informações da aba do conteúdo visível.',
            [
              '<html lang="pt-BR">',
              '<head><title>Guia de jardinagem</title></head>',
              '<body><main><h1>Jardinagem</h1></main></body>',
              '</html>',
            ],
          ),
          blank(
            'Complete o atributo que informa o idioma principal do documento.',
            'lang ajuda navegadores e tecnologias assistivas a tratar corretamente o texto.',
            'O nome é uma abreviação da palavra em inglês language.',
            '<html ___="pt-BR">',
            ['lang'],
          ),
          choice(
            'Encontre o erro: qual documento tem idioma, título e texto de link claros?',
            'A página deve informar lang, ter title dentro do head e nomear o destino do link.',
            'Confira o atributo e onde cada elemento está.',
            [
              '<html lang="pt-BR"><head><title>Guia de plantas</title></head><body><a href="/ervas">Conheça ervas</a></body></html>',
              '<html><body><title>Guia</title><a>clique aqui</a></body></html>',
              '<html lang="pt-BR"><body><head><title>Guia</title></head></body></html>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma página com idioma português, título da aba e h1 descritivo.',
            'O idioma é um atributo de html; title fica no head e h1 dentro do body.',
            'Use o mesmo assunto em title e h1, escrito como texto legível.',
            'html',
            '<!doctype html>\\n<html>\\n<head></head>\\n<body>\\n  <!-- Complete a página -->\\n</body>\\n</html>',
            [
              htmlAttribute('html', 'lang', 'pt-BR'),
              htmlElement('title', 'Guia de jardinagem'),
              htmlElement('h1', 'Guia de jardinagem'),
            ],
          ),
        ],
      ),
      review(['1:1:1', '1:2:1', '2:1:1', '2:3:1', '2:4:1']),
      project(
        'Projeto: página de apresentação',
        'Monte uma página de apresentação com cabeçalho, navegação, conteúdo principal, uma publicação e um rodapé.\n\nUse headings em uma sequência que represente a organização do conteúdo. A navegação deve ter links que expliquem seus destinos; a imagem precisa de uma descrição alternativa.\n\nO resultado deve fazer sentido antes de qualquer estilo. Leia os nomes dos elementos: eles devem explicar a estrutura da página para outra pessoa.',
        '<!-- Uma estrutura organizada antes de receber estilos. -->\\n<header><h1>Estúdio Aurora</h1><nav aria-label="Principal"><a href="#trabalhos">Trabalhos</a></nav></header>\\n<main><section id="trabalhos"><h2>Trabalhos recentes</h2><article><h3>Jardim comunitário</h3><p>Um espaço criado em conjunto.</p></article></section></main>\\n<footer><p>Contato: oi@example.com</p></footer>',
        'Um cabeçalho com navegação, uma seção de trabalho no conteúdo principal e um rodapé.',
        [
          choice(
            'Qual região deve conter o assunto central da página?',
            'main identifica a região principal do conteúdo.',
            'Escolha o elemento que dá nome ao conteúdo dominante.',
            ['main', 'nav', 'footer'],
          ),
          ordering(
            'Organize o conteúdo principal com uma seção e um artigo.',
            'Uma seção agrupa o assunto; um artigo representa uma publicação independente.',
            'Coloque a publicação dentro da seção correspondente.',
            [
              '<main>',
              '<section><h2>Trabalhos</h2>',
              '<article><h3>Projeto</h3></article>',
              '</section>',
              '</main>',
            ],
          ),
          blank(
            'Complete o elemento que agrupa links de navegação.',
            'nav representa uma região de navegação.',
            'Use a abreviação inglesa de navegação.',
            '<___ aria-label="Principal"><a href="/">Início</a></nav>',
            ['nav'],
          ),
          choice(
            'Encontre o erro: qual rodapé fica fora do conteúdo principal?',
            'O rodapé geral deve encerrar a página depois do conteúdo principal.',
            'Veja se main termina antes de footer começar.',
            [
              '<main><p>Projetos</p></main><footer><p>Contato</p></footer>',
              '<main><p>Projetos</p><footer><p>Rodapé geral</p></footer></main>',
              '<footer><main><p>Projetos</p></main></footer>',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Desafio do projeto: construa uma página com header, nav, main, article e footer.',
            'Use elementos semânticos para descrever a estrutura, uma imagem acessível e títulos em ordem.',
            'Inclua h1 com “Estúdio Aurora”, article com “Jardim comunitário” e uma imagem com alt.',
            'html',
            '<!-- Monte sua página de apresentação -->',
            [
              htmlElement('header', ''),
              htmlElement('nav', ''),
              htmlElement('main', ''),
              htmlElement('article', ''),
              htmlElement('footer', ''),
            ],
          ),
        ],
      ),
    ],
  },
  {
    titulo: 'CSS essencial',
    licoes: [
      lesson(
        'Seletores, cores e tipografia',
        'CSS descreve como os elementos serão apresentados. Uma regra começa com um seletor e reúne declarações entre chaves.\n\nUm seletor de tag, como p, escolhe elementos pelo nome; .aviso escolhe uma classe e #topo escolhe um id. As propriedades color, background-color e font-size controlam texto e cores.\n\nNo exemplo, o ponto antes de destaque significa que o estilo se aplica aos elementos com essa classe. Uma classe pode ser reutilizada em vários elementos.',
        '<!-- A classe destaque pode ser aplicada a mais de um elemento. -->\\n.destaque {\\n  color: #173b72;\\n  background-color: #e8f1ff;\\n  font-size: 1.125rem;\\n}',
        'O texto destacado fica azul-escuro, sobre fundo claro e com fonte um pouco maior.',
        [
          choice(
            'Qual seletor escolhe elementos com class="cartao"?',
            'O ponto inicia um seletor de classe.',
            'Classes usam um sinal antes do nome.',
            ['.cartao', '#cartao', 'cartao()'],
          ),
          ordering(
            'Organize uma regra para deixar parágrafos com texto escuro.',
            'Uma regra começa com o seletor e coloca propriedade e valor dentro de chaves.',
            'O seletor vem antes da chave de abertura.',
            ['p {', 'color: #222;', '}'],
          ),
          blank(
            'Complete o seletor para escolher id="aviso".',
            'O símbolo # seleciona um id.',
            'O símbolo também aparece em uma âncora de endereço.',
            '#___ { color: red; }',
            ['aviso'],
          ),
          choice(
            'Encontre o erro: qual declaração usa uma propriedade válida para tamanho de fonte?',
            'font-size recebe um tamanho como 20px ou 1.25rem.',
            'A propriedade de texto deve receber um valor de tamanho, não uma cor.',
            ['font-size: 20px;', 'color: 20px;', 'background-color: 20px;'],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: estilize .destaque com texto azul e fonte de 20px.',
            'O ponto seleciona uma classe; color e font-size controlam texto e tamanho.',
            'Escreva uma regra .destaque com as duas propriedades pedidas.',
            'css',
            '/* Estilize o destaque */',
            [
              css('.destaque', 'color', 'blue'),
              css('.destaque', 'font-size', '20px'),
            ],
          ),
        ],
      ),
      lesson(
        'Cascata e especificidade',
        'Cascata é a forma como o navegador decide qual regra aplicar quando várias regras atingem o mesmo elemento. A ordem no arquivo pode decidir um empate entre regras de peso igual.\n\nEspecificidade compara os seletores: id costuma ter mais peso que classe, e classe mais que tag. Por isso, uma regra muito específica pode vencer outra que aparece depois.\n\nEvite acumular ids e seletores longos. Classes com nomes claros deixam o CSS mais simples de manter e reduzem surpresas quando a página cresce.',
        '<!-- A regra de classe vale, mas a regra com id tem maior especificidade. -->\\n.aviso { color: navy; }\\n#alerta { color: firebrick; }',
        'Um elemento com id="alerta" e class="aviso" terá texto firebrick.',
        [
          choice(
            'Entre p, .texto e #principal, qual seletor tem maior especificidade?',
            'Um seletor de id tem mais especificidade que classe e tipo.',
            'Compare tag, classe e id nessa ordem.',
            ['#principal', '.texto', 'p'],
          ),
          ordering(
            'Coloque estas regras de menor para maior especificidade.',
            'Seletores de tag são menos específicos que classes, que são menos específicas que ids.',
            'Comece pelo nome de tag sem ponto ou cerquilha.',
            [
              'p { color: gray; }',
              '.texto { color: blue; }',
              '#principal { color: navy; }',
            ],
          ),
          blank(
            'Complete o seletor de classe, menos específico que #aviso.',
            'Uma classe começa com ponto e costuma ser reutilizável.',
            'Use o símbolo de classe antes do nome.',
            '___aviso { color: orange; }',
            ['.'],
          ),
          choice(
            'Encontre o erro: qual explicação da cascata está correta?',
            'A ordem ajuda a decidir quando a especificidade empata; seletores mais específicos podem vencer mesmo antes.',
            'Não considere apenas qual regra foi escrita por último.',
            [
              'Com especificidade igual, uma regra posterior pode vencer; um id pesa mais que uma classe.',
              'A regra escrita por último sempre vence, mesmo se o seletor tiver menos peso.',
              'O navegador escolhe a regra com mais declarações.',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma regra para a classe .mensagem usando uma única classe.',
            'Classes costumam ser suficientes e ajudam a manter a especificidade sob controle.',
            'Selecione .mensagem e defina color: teal.',
            'css',
            '/* Estilize a mensagem sem usar id */',
            [css('.mensagem', 'color', 'teal')],
          ),
        ],
      ),
      lesson(
        'Box model: espaço, borda e tamanho',
        'O box model descreve a caixa retangular de cada elemento. O conteúdo fica no centro, padding cria espaço interno, border desenha uma borda e margin cria espaço externo.\n\nSem ajuste, largura e altura podem somar padding e borda por fora do tamanho indicado. Com box-sizing: border-box, esses espaços entram na largura e altura declaradas.\n\nNo exemplo, o cartão tem espaço interno, borda e distância dos outros elementos. Essas propriedades ajudam a construir blocos organizados sem usar espaços no texto.',
        '<!-- O espaço é definido por propriedades, não por caracteres em branco. -->\\n.cartao {\\n  box-sizing: border-box;\\n  width: 18rem;\\n  padding: 1rem;\\n  border: 1px solid #ccd;\\n  margin: 1.5rem;\\n}',
        'Um cartão com largura controlada, borda, respiro interno e distância externa.',
        [
          choice(
            'Qual propriedade cria espaço entre o conteúdo e a borda?',
            'padding fica dentro da borda, ao redor do conteúdo.',
            'Compare espaço interno com espaço externo.',
            ['padding', 'margin', 'outline'],
          ),
          ordering(
            'Organize uma regra com largura e espaço interno.',
            'Seletor, chave e declarações formam a estrutura de uma regra.',
            'Comece com o seletor da caixa.',
            ['.painel {', 'width: 20rem;', 'padding: 1rem;', '}'],
          ),
          blank(
            'Complete a propriedade que cria espaço externo.',
            'margin controla o espaço ao redor da borda.',
            'O espaço interno usa padding; o externo começa com m.',
            '.painel { ___: 1rem; }',
            ['margin'],
          ),
          choice(
            'Encontre o erro: qual regra inclui padding e borda na largura informada?',
            'border-box inclui conteúdo, padding e borda na largura e altura declaradas.',
            'Procure a propriedade box-sizing e seu valor adequado.',
            [
              '* { box-sizing: border-box; }',
              '* { box-sizing: content-box; }',
              '* { padding: border-box; }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie um cartão com 16px de espaço interno e borda sólida de 1px.',
            'padding controla o espaço interno; border define espessura, estilo e cor.',
            'Use a classe .cartao e as propriedades padding e border.',
            'css',
            '/* Crie o cartão */',
            [
              css('.cartao', 'padding', '16px'),
              css('.cartao', 'border', '1px solid #ccc'),
            ],
          ),
        ],
      ),
      lesson(
        'Display e unidades CSS',
        'display define como uma caixa participa do layout. block começa uma nova linha; inline fica no fluxo do texto; flex e grid organizam elementos filhos em layouts.\n\npx é uma unidade fixa comum para bordas e detalhes. rem se relaciona ao tamanho de fonte do documento e facilita ampliar a interface; % depende do tamanho disponível do elemento pai.\n\nEscolha unidades de acordo com o efeito desejado. No exemplo, rem dá espaço que acompanha a fonte e max-width impede que o texto fique largo demais.',
        '<!-- rem acompanha o tamanho de fonte raiz; max-width limita a linha. -->\\n.conteudo {\\n  display: block;\\n  width: 90%;\\n  max-width: 42rem;\\n  margin: 0 auto;\\n  padding: 1rem;\\n}',
        'Uma área que ocupa até 90% do espaço, limitada a 42rem e centralizada.',
        [
          choice(
            'Qual valor de display organiza os filhos como itens flexíveis em uma linha ou coluna?',
            'display: flex ativa o modelo flexbox para os filhos diretos.',
            'O valor tem o mesmo nome do layout Flexbox.',
            ['flex', 'inline', 'none'],
          ),
          ordering(
            'Organize as declarações para centralizar um bloco com largura máxima.',
            'O bloco pode ter largura máxima e margens laterais automáticas.',
            'Defina o limite e depois distribua a margem.',
            ['.texto {', 'max-width: 40rem;', 'margin: 0 auto;', '}'],
          ),
          blank(
            'Complete a unidade relativa ao tamanho da fonte raiz.',
            'rem se relaciona à fonte do elemento raiz.',
            'O nome termina com a letra m.',
            'padding: 1___;',
            ['rem'],
          ),
          choice(
            'Encontre o erro: qual regra usa display corretamente para ativar grid?',
            'display recebe o valor grid para criar um contêiner Grid.',
            'O valor precisa ser uma palavra reconhecida por display.',
            [
              '.grade { display: grid; }',
              '.grade { display: 3fr; }',
              '.grade { grid: display; }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: deixe .lista como flex e use um espaço de 1rem entre os itens.',
            'display: flex organiza os filhos; gap controla o espaço entre eles.',
            'Use display e gap na mesma regra.',
            'css',
            '/* Organize a lista */',
            [css('.lista', 'display', 'flex'), css('.lista', 'gap', '1rem')],
          ),
        ],
      ),
      review(['1:1:1', '1:3:1', '2:1:1', '3:1:1', '3:3:1']),
      project(
        'Projeto: cartão de produto',
        'Construa um cartão de produto com título, descrição, preço e botão. Primeiro organize o HTML; depois aplique seletores de classe e as propriedades do box model.\n\nDefina tamanhos que funcionem em uma área estreita e dê respiro entre conteúdo, borda e elementos próximos. Use cores com contraste para manter o texto legível.\n\nReleia suas regras: os seletores devem ser claros e a especificidade deve continuar baixa. O próximo módulo vai usar esses fundamentos para construir layouts completos.',
        '<!-- O cartão combina conteúdo e regras de apresentação. -->\\n<article class="produto">\\n  <h2>Caneca térmica</h2>\\n  <p>Conserva sua bebida por mais tempo.</p>\\n  <strong>R$ 49</strong>\\n  <button>Comprar</button>\\n</article>\\n<style>\\n.produto { padding: 1rem; border: 1px solid #ccd; border-radius: 0.75rem; }\\n</style>',
        'Um cartão de produto delimitado por uma borda e com conteúdo espaçado.',
        [
          choice(
            'Qual propriedade cria o respiro dentro da borda do cartão?',
            'padding cria espaço interno, entre conteúdo e borda.',
            'Procure a propriedade que atua dentro da borda.',
            ['padding', 'margin', 'font-style'],
          ),
          ordering(
            'Organize uma regra para a classe .produto com borda e espaço interno.',
            'Uma regra CSS começa pelo seletor e contém as declarações entre chaves.',
            'Escreva primeiro a classe e depois as propriedades.',
            ['.produto {', 'padding: 1rem;', 'border: 1px solid #ccc;', '}'],
          ),
          blank(
            'Complete o seletor de classe do cartão.',
            'O seletor de classe começa com ponto.',
            'O id usaria #; a classe usa outro símbolo.',
            '___produto { padding: 1rem; }',
            ['.'],
          ),
          choice(
            'Encontre o erro: qual regra aplica uma cor de fundo válida ao cartão?',
            'background-color recebe uma cor, não uma unidade de tamanho.',
            'Observe se a unidade e a propriedade combinam.',
            [
              '.produto { background-color: #fff; }',
              '.produto { background-color: 20px; }',
              '.produto { padding: blue; }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Desafio do projeto: estilize .produto com fundo branco, padding de 16px e borda arredondada.',
            'Reúna seletores, cores, box model e cantos arredondados em uma regra para o cartão.',
            'Use .produto com background-color, padding e border-radius.',
            'css',
            '/* Estilize o cartão */',
            [
              css('.produto', 'background-color', 'white'),
              css('.produto', 'padding', '16px'),
              css('.produto', 'border-radius', '12px'),
            ],
          ),
        ],
      ),
    ],
  },
  {
    titulo: 'Layout moderno',
    licoes: [
      lesson(
        'Flexbox: alinhar uma dimensão',
        'Flexbox organiza itens em uma direção principal: linha ou coluna. Ele funciona bem para menus, barras de ação e grupos de cartões que precisam se alinhar.\n\nNo contêiner, display: flex ativa o layout. flex-direction escolhe a direção, justify-content distribui os itens no eixo principal e align-items alinha no outro eixo.\n\nUse gap para criar espaços consistentes entre os itens. No exemplo, o menu mantém os links em linha e distribui o espaço entre eles.',
        '<!-- Um contêiner flex organiza seus filhos em linha. -->\\n.menu {\\n  display: flex;\\n  justify-content: space-between;\\n  align-items: center;\\n  gap: 1rem;\\n}',
        'Os itens do menu ficam alinhados em uma linha, com espaço entre eles.',
        [
          choice(
            'Qual declaração ativa Flexbox para os filhos de .menu?',
            'Flexbox é ativado com display: flex no elemento contêiner.',
            'É uma propriedade display com um valor que nomeia o layout.',
            ['display: flex;', 'flex-direction: row;', 'align-items: center;'],
          ),
          ordering(
            'Organize uma regra Flexbox que centraliza itens verticalmente.',
            'Primeiro ative o modelo; depois defina o alinhamento transversal.',
            'display ativa o contêiner antes dos ajustes de alinhamento.',
            ['.barra {', 'display: flex;', 'align-items: center;', '}'],
          ),
          blank(
            'Complete a propriedade que distribui itens no eixo principal.',
            'justify-content controla a distribuição no eixo principal.',
            'O nome começa com “justify”.',
            '.menu { display: flex; ___: space-between; }',
            ['justify-content'],
          ),
          choice(
            'Encontre o erro: qual par cria espaço entre itens sem usar margens individuais?',
            'gap define o espaço entre itens de flex ou grid.',
            'Escolha a propriedade do contêiner para separar filhos.',
            [
              '.menu { display: flex; gap: 1rem; }',
              '.menu { display: flex; margin-between: 1rem; }',
              '.menu { gap: flex; }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: alinhe .acoes em linha, centralize os itens e use 12px de espaço.',
            'Flexbox, align-items e gap resolvem a organização e o alinhamento do grupo.',
            'Inclua display: flex, align-items: center e gap: 12px.',
            'css',
            '/* Organize as ações */',
            [
              css('.acoes', 'display', 'flex'),
              css('.acoes', 'align-items', 'center'),
              css('.acoes', 'gap', '12px'),
            ],
          ),
        ],
      ),
      lesson(
        'Grid: linhas e colunas',
        'CSS Grid organiza itens em linhas e colunas ao mesmo tempo. Ele é útil para galerias, painéis e áreas com várias colunas.\n\nDefina display: grid no contêiner. grid-template-columns descreve as colunas; repeat e minmax ajudam a repetir tamanhos sem escrever cada coluna separadamente.\n\nA unidade fr divide o espaço disponível em partes flexíveis. No exemplo, três colunas iguais compartilham o espaço do contêiner.',
        '<!-- repeat cria três colunas flexíveis iguais. -->\\n.galeria {\\n  display: grid;\\n  grid-template-columns: repeat(3, 1fr);\\n  gap: 1rem;\\n}',
        'Uma galeria com três colunas do mesmo tamanho e espaço entre cartões.',
        [
          choice(
            'Qual propriedade descreve as colunas de um grid?',
            'grid-template-columns define a quantidade e o tamanho das colunas.',
            'O nome diz qual parte do template está sendo configurada.',
            ['grid-template-columns', 'justify-content', 'flex-direction'],
          ),
          ordering(
            'Organize uma grade simples de duas colunas iguais.',
            'Ative grid e descreva duas colunas que dividem o espaço igualmente.',
            'O contêiner precisa mudar display antes de configurar as colunas.',
            [
              '.grade {',
              'display: grid;',
              'grid-template-columns: repeat(2, 1fr);',
              '}',
            ],
          ),
          blank(
            'Complete a unidade que divide espaço flexível em Grid.',
            'fr representa uma fração do espaço disponível no grid.',
            'A unidade tem duas letras e começa com f.',
            'grid-template-columns: 1___ 1fr;',
            ['fr'],
          ),
          choice(
            'Encontre o erro: qual declaração cria três colunas flexíveis?',
            'repeat(3, 1fr) repete três colunas com uma fração cada.',
            'Procure a quantidade e a unidade fr.',
            [
              'grid-template-columns: repeat(3, 1fr);',
              'grid-template-columns: repeat(1fr, 3);',
              'grid-template-columns: 3px 1fr;',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie .galeria com Grid, duas colunas iguais e espaço de 16px.',
            'Grid define linhas e colunas; gap separa os cartões sem margem individual.',
            'Use repeat(2, 1fr) para as colunas.',
            'css',
            '/* Monte a galeria */',
            [
              css('.galeria', 'display', 'grid'),
              css('.galeria', 'grid-template-columns', 'repeat(2, 1fr)'),
              css('.galeria', 'gap', '16px'),
            ],
          ),
        ],
      ),
      lesson(
        'Posicionamento de elementos',
        'position altera como um elemento é colocado. static é o fluxo normal; relative permite ajustar a posição mantendo o espaço original; absolute posiciona em relação ao ancestral posicionado mais próximo.\n\nfixed fica preso à janela enquanto a página rola. sticky acompanha a rolagem até certo ponto. Use top, right, bottom e left para indicar deslocamentos.\n\nPrefira Flexbox e Grid para organizar a estrutura geral. position é útil para sobrepor um selo em um cartão ou manter um controle próximo de uma área específica.',
        '<!-- O cartão posicionado serve de referência ao selo. -->\\n.cartao { position: relative; }\\n.selo {\\n  position: absolute;\\n  top: 0.5rem;\\n  right: 0.5rem;\\n}',
        'O selo fica no canto superior direito do cartão.',
        [
          choice(
            'Em relação a que o elemento absolute se posiciona quando existe um ancestral posicionado?',
            'Ele usa como referência o ancestral posicionado mais próximo.',
            'Procure primeiro nos pais do elemento.',
            [
              'Ao ancestral posicionado mais próximo.',
              'Sempre à janela inteira.',
              'Ao elemento seguinte no HTML.',
            ],
          ),
          ordering(
            'Organize regras para colocar um selo no canto superior direito do cartão.',
            'O cartão cria uma referência relativa e o selo usa position absolute e offsets.',
            'Prepare primeiro o elemento que servirá de referência.',
            [
              '.cartao { position: relative; }',
              '.selo { position: absolute;',
              'top: 0; right: 0;',
              '}',
            ],
          ),
          blank(
            'Complete o valor que prende um elemento à janela durante a rolagem.',
            'fixed posiciona em relação à janela de visualização.',
            'O valor em inglês significa “fixo”.',
            '.botao-topo { position: ___; }',
            ['fixed'],
          ),
          choice(
            'Encontre o erro: qual declaração mantém o elemento no fluxo e permite deslocá-lo?',
            'relative mantém o espaço original e permite ajustar seu posicionamento.',
            'Não confunda relative com absolute.',
            ['position: relative;', 'position: abolute;', 'position: normal;'],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: faça .cartao ser referência e coloque .selo no canto superior direito.',
            'O ancestral relative fornece a referência para o descendente absolute.',
            'Defina position: relative no cartão e top/right no selo.',
            'css',
            '/* Posicione o selo no cartão */',
            [
              css('.cartao', 'position', 'relative'),
              css('.selo', 'position', 'absolute'),
              css('.selo', 'top', '0'),
              css('.selo', 'right', '0'),
            ],
          ),
        ],
      ),
      lesson(
        'Responsividade e mobile-first',
        'Uma página responsiva se adapta a diferentes larguras e formas de uso. Mobile-first significa começar com uma tela estreita e acrescentar ajustes para telas maiores.\n\nMedia queries aplicam regras quando uma condição é atendida. O meta viewport ajuda o navegador móvel a usar a largura real do dispositivo.\n\nUse medidas flexíveis, conteúdo que possa quebrar de linha e poucos pontos de mudança. No exemplo, os cartões ficam em coluna por padrão e passam a duas colunas quando há espaço.',
        '<!-- Comece com uma coluna e amplie o layout em telas maiores. -->\\n.grade { display: grid; grid-template-columns: 1fr; gap: 1rem; }\\n@media (min-width: 48rem) {\\n  .grade { grid-template-columns: repeat(2, 1fr); }\\n}',
        'Em uma tela estreita, os cartões ficam em uma coluna; em uma tela larga, ficam em duas.',
        [
          choice(
            'O que uma media query permite fazer?',
            'Ela aplica regras CSS conforme condições, como a largura da tela.',
            'Pense em quando o navegador deve ativar um grupo de estilos.',
            [
              'Aplicar estilos sob certas condições de tela.',
              'Adicionar elementos HTML.',
              'Executar JavaScript no servidor.',
            ],
          ),
          ordering(
            'Organize uma media query para telas a partir de 48rem.',
            'A condição vem após @media e as regras internas só valem quando ela é atendida.',
            'Abra a media query antes da regra que deve mudar.',
            [
              '@media (min-width: 48rem) {',
              '.grade { grid-template-columns: repeat(2, 1fr); }',
              '}',
            ],
          ),
          blank(
            'Complete a tag meta que controla a largura inicial em dispositivos móveis.',
            'viewport informa como a página deve usar a largura do dispositivo.',
            'O valor começa com “view”.',
            '<meta name="___" content="width=device-width, initial-scale=1">',
            ['viewport'],
          ),
          choice(
            'Encontre o erro: qual media query aplica o layout quando a tela tem no máximo 600px?',
            'max-width limita a condição a telas até o valor indicado.',
            'Compare max-width com min-width.',
            [
              '@media (max-width: 600px) { .menu { flex-direction: column; } }',
              '@media (min-width: 600px) { .menu { flex-direction: column; } }',
              '@media (600px) { .menu { flex-direction: column; } }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: faça .grade ter uma coluna por padrão e duas colunas acima de 700px.',
            'Comece pelo estilo móvel e use uma media query min-width para telas maiores.',
            'O verificador confere as duas colunas e a condição de largura mínima.',
            'css',
            '/* Comece pelo celular */\\n.grade { display: grid; grid-template-columns: 1fr; }',
            [
              { tipo: 'CSS_MEDIA_QUERY', condicao: '(min-width: 700px)' },
              css('.grade', 'grid-template-columns', 'repeat(2, 1fr)'),
            ],
          ),
        ],
      ),
      review(['2:2:1', '3:4:1', '4:1:1', '4:2:1', '4:4:1']),
      project(
        'Projeto: página responsiva de portfólio',
        'Construa uma página com cabeçalho, uma área de apresentação e uma galeria de projetos. Use Grid para a galeria e Flexbox para alinhar itens do cabeçalho.\n\nComece pelo layout de uma coluna; depois use media query para ampliar a galeria. Faça os cartões caberem em telas pequenas e mantenha um espaço consistente.\n\nPosicione o selo de destaque dentro do cartão somente se isso ajudar a comunicar o conteúdo. Teste mentalmente o que acontece quando a tela fica estreita.',
        '<!-- A galeria começa em uma coluna e cresce em telas largas. -->\\n<header class="topo"><h1>Portfólio de Jo</h1><nav><a href="#projetos">Projetos</a></nav></header>\\n<main><section id="projetos" class="galeria"><article class="cartao"><h2>Site de receitas</h2></article><article class="cartao"><h2>Agenda de estudos</h2></article></section></main>\\n<style>.topo { display: flex; gap: 1rem; } .galeria { display: grid; grid-template-columns: 1fr; gap: 1rem; } @media (min-width: 700px) { .galeria { grid-template-columns: repeat(2, 1fr); } }</style>',
        'Uma página de portfólio com navegação e uma galeria que muda de uma para duas colunas.',
        [
          choice(
            'Qual modelo é mais adequado para uma galeria de linhas e colunas?',
            'Grid permite organizar duas dimensões, linhas e colunas.',
            'Pense no layout de cartões em uma grade.',
            ['CSS Grid', 'position: fixed', 'text-align'],
          ),
          ordering(
            'Organize uma galeria com duas colunas flexíveis.',
            'Ative Grid e depois descreva as colunas.',
            'display precisa vir antes da configuração das colunas.',
            [
              '.galeria {',
              'display: grid;',
              'grid-template-columns: repeat(2, 1fr);',
              '}',
            ],
          ),
          blank(
            'Complete a propriedade para adicionar espaço entre os cartões.',
            'gap separa os itens em layouts Grid e Flexbox.',
            'É uma palavra curta de três letras.',
            '.galeria { display: grid; ___: 1rem; }',
            ['gap'],
          ),
          choice(
            'Encontre o erro: qual regra aumenta colunas em telas maiores?',
            'min-width ativa os estilos a partir do limite, mantendo o padrão móvel abaixo dele.',
            'Use uma largura mínima para ampliar o layout.',
            [
              '@media (min-width: 700px) { .galeria { grid-template-columns: repeat(2, 1fr); } }',
              '@media (max-width: 700px) { .galeria { grid-template-columns: repeat(2, 1fr); } }',
              '@media (min-width: 700px) { .galeria { display: repeat(2); } }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Desafio do projeto: aplique Flexbox no cabeçalho e Grid responsivo na galeria.',
            'O layout combina os dois modelos. A media query amplia a galeria sem executar código do aluno.',
            'Inclua .topo com display flex e .galeria com Grid, duas colunas e a condição min-width.',
            'css',
            '/* Estilize o portfólio */',
            [
              css('.topo', 'display', 'flex'),
              css('.galeria', 'display', 'grid'),
              { tipo: 'CSS_MEDIA_QUERY', condicao: '(min-width: 700px)' },
              css('.galeria', 'grid-template-columns', 'repeat(2, 1fr)'),
            ],
          ),
        ],
      ),
    ],
  },
  {
    titulo: 'JavaScript básico',
    licoes: [
      lesson(
        'Variáveis, valores e operadores',
        'JavaScript dá comportamento à página e também pode ser usado fora do navegador. Uma variável guarda um valor com um nome que você escolhe.\n\nUse const quando não pretende reatribuir a variável e let quando o valor precisa mudar. Valores podem ser textos, números, booleanos ou outros dados. typeof ajuda a observar o tipo de um valor.\n\nOperadores fazem contas e comparações. O exemplo calcula um total e mostra uma mensagem no console; comentários começam com // e não são executados.',
        '// const mantém a referência do total; let permite atualizar pontos.\\nconst preco = 25;\\nlet quantidade = 2;\\nquantidade = quantidade + 1;\\nconst total = preco * quantidade;\\nconsole.log(total);',
        'O console mostra 75.',
        [
          choice(
            'Qual declaração é adequada para um valor que não será reatribuído?',
            'const impede reatribuir aquela variável e deixa a intenção explícita.',
            'Escolha a declaração que comunica que o vínculo não será trocado.',
            ['const', 'let', 'var sempre'],
          ),
          ordering(
            'Organize as linhas para calcular o dobro de um número.',
            'Declare o valor antes de usá-lo e calcule o resultado em outra constante.',
            'A variável usada no cálculo deve existir primeiro.',
            [
              'const numero = 4;',
              'const dobro = numero * 2;',
              'console.log(dobro);',
            ],
          ),
          blank(
            'Complete o operador de igualdade estrita.',
            '=== compara valor e tipo sem conversão automática.',
            'Ele tem três sinais de igual.',
            'if (idade ___ 18) { }',
            ['==='],
          ),
          choice(
            'Encontre o erro: qual linha atualiza corretamente uma variável declarada com let?',
            'let permite reatribuir um novo valor à variável.',
            'Confirme se a declaração e a atualização usam o mesmo nome.',
            [
              'let tentativas = 0; tentativas = tentativas + 1;',
              'const tentativas = 0; tentativas = tentativas + 1;',
              'let tentativas = 0; const tentativas = 1;',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: declare const preco e quantidade e registre o total no console.',
            'A verificação analisa a estrutura JavaScript sem executar o código enviado.',
            'Declare os dois valores com const e calcule o total.',
            'javascript',
            '// Calcule o total e registre-o',
            [
              jsVariable('preco'),
              jsVariable('quantidade'),
              jsVariable('total'),
            ],
          ),
        ],
      ),
      lesson(
        'Tipos, condicionais e decisões',
        'Uma condição permite escolher o que fazer. O if executa um bloco quando uma expressão é verdadeira; else oferece outro caminho.\n\nComparações como === e > produzem um booleano: true ou false. Combine condições com && (e) e || (ou), usando parênteses para deixar a intenção clara.\n\nO operador ternário é uma forma curta de escolher entre dois valores. Para vários caminhos, if e else costumam ser mais fáceis de ler. O exemplo verifica uma idade antes de mostrar uma mensagem.',
        '// A comparação produz true ou false.\\nconst idade = 20;\\nif (idade >= 18) {\\n  console.log("Maior de idade");\\n} else {\\n  console.log("Menor de idade");\\n}',
        'O console mostra “Maior de idade”.',
        [
          choice(
            'Qual bloco roda quando a condição do if é falsa?',
            'else define o caminho alternativo quando a condição não é atendida.',
            'Procure a palavra que significa “caso contrário”.',
            ['else', 'return', 'const'],
          ),
          ordering(
            'Organize uma condição que verifica se há estoque.',
            'O if abre a decisão; sua condição vem entre parênteses.',
            'Escreva primeiro a condição e depois o bloco.',
            ['if (estoque > 0) {', 'console.log("Disponível");', '}'],
          ),
          blank(
            'Complete o operador lógico “e”.',
            '&& exige que as duas condições sejam verdadeiras.',
            'O operador usa dois símbolos iguais ao sinal “&”.',
            'if (logado ___ temAcesso) { }',
            ['&&'],
          ),
          choice(
            'Encontre o erro: qual condição compara valor e tipo sem coerção?',
            '=== exige igualdade tanto de valor quanto de tipo.',
            'Compare os operadores de igualdade com dois e três sinais.',
            [
              'if (resposta === 42) { }',
              'if (resposta = 42) { }',
              'if (resposta == 42) { }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma função que retorne “Aprovado” quando a nota for pelo menos 7.',
            'Uma função nomeada e uma condição permitem reaproveitar a regra de aprovação.',
            'Crie function avaliar e use if com nota >= 7.',
            'javascript',
            '// Escreva a função de avaliação',
            [jsFunction('avaliar')],
          ),
        ],
      ),
      lesson(
        'Repetições com laços',
        'Um laço repete instruções sem copiar as mesmas linhas. for é útil quando você conhece a contagem ou precisa acompanhar um índice.\n\nwhile repete enquanto uma condição for verdadeira. Atualize dentro do laço o valor usado na condição; sem isso, a repetição pode não terminar.\n\nfor...of percorre os valores de uma lista de forma direta. Escolha o laço que deixe mais claro o que está sendo repetido e teste os limites da condição.',
        '// for...of percorre cada nome sem precisar controlar um índice.\\nconst nomes = ["Lia", "Noah"];\\nfor (const nome of nomes) {\\n  console.log(nome);\\n}',
        'O console mostra “Lia” e depois “Noah”.',
        [
          choice(
            'Qual laço percorre diretamente os valores de um array?',
            'for...of entrega cada valor da sequência durante a repetição.',
            'Escolha a forma que não exige ler índices manualmente.',
            ['for...of', 'if...else', 'switch'],
          ),
          ordering(
            'Organize um for que conte de 0 até 2.',
            'Inicialize o contador, teste o limite e incremente em cada repetição.',
            'A parte inicial do for vem antes do primeiro ponto e vírgula.',
            ['for (let i = 0;', 'i < 3;', 'i++) { console.log(i); }'],
          ),
          blank(
            'Complete a palavra-chave que interrompe uma repetição antes do fim.',
            'break encerra o laço atual.',
            'A palavra significa “interromper” em inglês.',
            'if (achou) { ___; }',
            ['break'],
          ),
          choice(
            'Encontre o erro: qual while altera o contador para que a condição possa terminar?',
            'O contador precisa mudar dentro do corpo do laço.',
            'Confira se existe incremento em cada repetição.',
            [
              'let i = 0; while (i < 3) { console.log(i); i++; }',
              'let i = 0; while (i < 3) { console.log(i); }',
              'while (i < 3) { let i = 0; }',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma função que percorra um array usando for...of.',
            'O código é analisado como JavaScript estático; o servidor não o executa.',
            'Declare a função listar e use for...of para percorrer os itens.',
            'javascript',
            '// Escreva uma função para listar itens',
            [jsFunction('listar')],
          ),
        ],
      ),
      lesson(
        'Funções reutilizáveis',
        'Uma função reúne instruções que podem ser chamadas quando necessário. Parâmetros recebem dados; return devolve um resultado para quem chamou.\n\nUma declaração function pode ser chamada pelo nome. Funções de seta, escritas com =>, são úteis em callbacks e podem ser guardadas em const.\n\nDê nomes que expliquem a tarefa e mantenha cada função focada. O exemplo transforma um nome e devolve uma saudação, sem repetir a lógica em cada lugar.',
        '// A função recebe um nome e devolve uma mensagem.\\nfunction criarSaudacao(nome) {\\n  return `Olá, ${nome}!`;\\n}\\nconst mensagem = criarSaudacao("Ravi");\\nconsole.log(mensagem);',
        'O console mostra “Olá, Ravi!”.',
        [
          choice(
            'O que return faz em uma função?',
            'return encerra a chamada e entrega um valor ao código que chamou a função.',
            'Pense em como o resultado sai da função.',
            [
              'Devolve um valor para quem chamou a função.',
              'Repete o bloco de código.',
              'Cria uma variável global automaticamente.',
            ],
          ),
          ordering(
            'Organize uma função que receba dois valores e devolva a soma.',
            'Declare a função, calcule com os parâmetros e retorne o resultado.',
            'A função começa antes do bloco de instruções.',
            [
              'function somar(a, b) {',
              'const resultado = a + b;',
              'return resultado;',
              '}',
            ],
          ),
          blank(
            'Complete a palavra-chave que devolve um resultado da função.',
            'return envia o valor calculado para fora da função.',
            'A palavra começa com “ret”.',
            'function dobro(valor) { ___ valor * 2; }',
            ['return'],
          ),
          choice(
            'Encontre o erro: qual função pode ser chamada e devolve o dobro do valor?',
            'A função precisa receber um parâmetro e retornar o cálculo.',
            'Confira se o nome chamado coincide com o nome declarado.',
            [
              'function dobro(n) { return n * 2; }',
              'function dobro(n) { n * 2; }',
              'function dobrar(n) { return n * 2; } dobro(3);',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma função chamada calcularDesconto que receba um preço.',
            'Uma função nomeada deixa a operação reaproveitável. Esta etapa usa validação estrutural estática.',
            'Declare function calcularDesconto com um parâmetro chamado preco.',
            'javascript',
            '// Declare a função calcularDesconto',
            [jsFunction('calcularDesconto')],
          ),
        ],
      ),
      lesson(
        'Arrays, objetos e métodos',
        'Array é uma lista ordenada de valores; objeto agrupa informações nomeadas. Um array pode guardar objetos, como produtos com nome e preço.\n\nmap cria uma lista transformada, filter mantém os itens que passam por uma condição e find procura o primeiro item correspondente. Esses métodos recebem uma função para cada item.\n\nPrefira const para a lista quando não for trocar sua referência. As operações podem gerar novos arrays; o exemplo seleciona produtos em estoque e extrai seus nomes.',
        '// filter seleciona os itens; map transforma os resultados.\\nconst produtos = [{ nome: "Caneca", disponivel: true }, { nome: "Caderno", disponivel: false }];\\nconst nomesDisponiveis = produtos.filter((item) => item.disponivel).map((item) => item.nome);\\nconsole.log(nomesDisponiveis);',
        'O console mostra uma lista com “Caneca”.',
        [
          choice(
            'Qual método cria um novo array transformando cada item?',
            'map produz um valor de saída para cada item do array.',
            'Pense em mapear cada valor para outro formato.',
            ['map', 'filter', 'find'],
          ),
          ordering(
            'Organize uma expressão que mantenha números maiores que 5.',
            'filter recebe uma condição e conserva os itens que passam nela.',
            'Comece pelo array e aplique o método de seleção.',
            ['const maiores = numeros', '.filter((numero) => numero > 5);'],
          ),
          blank(
            'Complete o método que encontra o primeiro item correspondente.',
            'find retorna o primeiro item que satisfaz a condição.',
            'O nome em inglês significa “encontrar”.',
            'const usuario = usuarios.___((item) => item.id === 3);',
            ['find'],
          ),
          choice(
            'Encontre o erro: qual acesso lê a propriedade nome do objeto?',
            'O ponto acessa uma propriedade pelo nome definido no objeto.',
            'O objeto guarda dados nomeados, não posições numéricas como um array.',
            [
              'produto.nome',
              'produto[0] quando produto é um objeto simples',
              'produto->nome',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie uma função nomesAtivos que filtre itens ativos e use map para obter seus nomes.',
            'O parser verifica a estrutura JavaScript sem executar a função nem avaliar dados do usuário.',
            'Declare nomesAtivos e use filter e map dentro da função.',
            'javascript',
            '// Receba uma lista e devolva os nomes ativos',
            [jsFunction('nomesAtivos'), jsMethod('filter'), jsMethod('map')],
          ),
        ],
      ),
      lesson(
        'Depuração com console.log',
        'Depurar é investigar por que um programa não se comporta como esperado. Uma forma simples de começar é verificar os valores em pontos importantes.\n\nconsole.log mostra valores no console do navegador ou do ambiente JavaScript. Registre uma variável antes e depois de uma transformação para observar onde o resultado muda.\n\nTambém leia a mensagem de erro e a linha indicada. Remova logs temporários depois da investigação ou deixe apenas os que ajudam a entender o programa.',
        '// O log antes e depois ajuda a localizar uma mudança inesperada.\\nconst preco = 12;\\nconsole.log("Preço inicial:", preco);\\nconst total = preco * 2;\\nconsole.log("Total:", total);',
        'O console mostra o preço inicial e o total calculado.',
        [
          choice(
            'Para que serve console.log durante uma investigação?',
            'Ele imprime valores no console para que você observe o que o programa está usando.',
            'Pense em uma forma de inspecionar dados enquanto o programa roda.',
            [
              'Observar valores durante a depuração.',
              'Corrigir automaticamente todos os erros.',
              'Publicar o programa na internet.',
            ],
          ),
          ordering(
            'Organize uma verificação do valor antes e depois de uma conta.',
            'Registre a entrada, calcule o resultado e então registre a saída.',
            'O valor deve ser declarado antes de aparecer no log.',
            [
              'const pontos = 10;',
              'console.log("Entrada:", pontos);',
              'const dobro = pontos * 2;',
              'console.log("Saída:", dobro);',
            ],
          ),
          blank(
            'Complete o método usado para mostrar uma mensagem no console.',
            'console.log escreve uma mensagem no console.',
            'O método tem o nome “log”.',
            'console.___("Depurando");',
            ['log'],
          ),
          choice(
            'Encontre o erro: qual linha registra o valor da variável resultado?',
            'Passe o valor como argumento do método log.',
            'O nome da variável deve aparecer dentro dos parênteses.',
            [
              'console.log(resultado);',
              'console.log = resultado;',
              'resultado.console("log");',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Mini-desafio: crie a função registrarTotal e inclua um log com o valor total.',
            'A validação estática confere a declaração da função e a presença de uma chamada de console.log.',
            'Crie registrarTotal com um parâmetro total e use console.log no corpo.',
            'javascript',
            '// Registre o total recebido',
            [jsFunction('registrarTotal')],
          ),
        ],
      ),
      review(['4:1:1', '5:1:1', '5:3:1', '5:4:1', '5:5:1']),
      project(
        'Projeto: resumo de pedidos',
        'Crie uma função que receba uma lista de pedidos. Cada pedido é um objeto com produto, quantidade e estado de entrega.\n\nUse filter para separar pedidos ativos e map para transformar os resultados em nomes de produto. Faça uma função adicional para calcular o valor de um item ou registrar um resumo no console.\n\nEste exercício verifica a estrutura do JavaScript, não executa o código. Leia os nomes e as chamadas para confirmar que a solução expressa o fluxo que você pretende.',
        '// Funções pequenas deixam cada transformação visível.\\nfunction pedidosAtivos(pedidos) {\\n  return pedidos.filter((pedido) => pedido.ativo).map((pedido) => pedido.produto);\\n}\\nconst pedidos = [{ produto: "Livro", ativo: true }];\\nconsole.log(pedidosAtivos(pedidos));',
        'A função devolve os nomes dos produtos dos pedidos ativos.',
        [
          choice(
            'Qual método deve ser usado para manter apenas pedidos ativos?',
            'filter mantém os itens cuja condição é verdadeira.',
            'Você quer selecionar alguns itens, sem transformar cada um ainda.',
            ['filter', 'map', 'find'],
          ),
          ordering(
            'Organize uma transformação que filtra pedidos e depois obtém os produtos.',
            'Filtre primeiro; depois transforme cada pedido restante no nome do produto.',
            'A ordem dos métodos muda o resultado da operação.',
            [
              'pedidos',
              '.filter((pedido) => pedido.ativo)',
              '.map((pedido) => pedido.produto)',
            ],
          ),
          blank(
            'Complete o método que transforma cada pedido no nome do produto.',
            'map transforma cada elemento em um novo valor.',
            'Você está convertendo cada objeto em uma propriedade.',
            'pedidos.map((pedido) => pedido.___);',
            ['produto'],
          ),
          choice(
            'Encontre o erro: qual chamada mostra o resultado no console?',
            'console.log recebe o resultado como argumento.',
            'A chamada precisa usar parênteses depois do nome do método.',
            [
              'console.log(pedidosAtivos(pedidos));',
              'console.log = pedidosAtivos(pedidos);',
              'pedidosAtivos.console(pedidos);',
            ],
            0,
            TipoDesafio.ENCONTRAR_ERRO,
          ),
          code(
            'Desafio do projeto: crie pedidosAtivos com filter e map e registre o resultado.',
            'A correção analisa sintaxe e estrutura com um parser JavaScript; o código nunca é executado pelo servidor.',
            'Declare a função pedidosAtivos e inclua filter, map e console.log.',
            'javascript',
            '// Transforme uma lista de pedidos ativos',
            [jsFunction('pedidosAtivos'), jsMethod('filter'), jsMethod('map')],
          ),
        ],
      ),
    ],
  },
  {
    titulo: 'JavaScript no navegador',
    licoes: [
      {
        titulo: 'Encontrando elementos no DOM',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Eventos e formulários',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Armazenando preferências com localStorage',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Fetch, JSON e async/await',
        publicada: false,
        explicacao: 'Em breve.',
      },
    ],
  },
  {
    titulo: 'TypeScript introdutório',
    licoes: [
      {
        titulo: 'Tipos básicos e inferência',
        publicada: false,
        explicacao: 'Em breve.',
      },
      { titulo: 'Funções tipadas', publicada: false, explicacao: 'Em breve.' },
      {
        titulo: 'Interfaces para descrever dados',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Por que usar TypeScript',
        publicada: false,
        explicacao: 'Em breve.',
      },
    ],
  },
  {
    titulo: 'Ferramentas profissionais',
    licoes: [
      {
        titulo: 'Terminal e comandos essenciais',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Git: histórico e commits',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Branches e pull requests',
        publicada: false,
        explicacao: 'Em breve.',
      },
      {
        titulo: 'Lendo documentação da MDN',
        publicada: false,
        explicacao: 'Em breve.',
      },
    ],
  },
];

function referenceKey(
  moduleOrder: number,
  lessonOrder: number,
  challengeOrder: number,
) {
  return `${moduleOrder}:${lessonOrder}:${challengeOrder}`;
}

async function syncOptions(
  transaction: Prisma.TransactionClient,
  challengeId: number,
  optionSeeds: OptionSeed[],
) {
  const existing = await transaction.opcao.findMany({
    where: { desafioId: challengeId },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  const updatedOptions = optionSeeds.slice(0, existing.length);
  if (updatedOptions.length > 0) {
    await transaction.$executeRaw`
      UPDATE opcoes AS o
      SET texto = v.texto,
          correta = v.correta,
          posicao_correta = v.posicao_correta
      FROM UNNEST(
        ${existing.slice(0, updatedOptions.length).map(({ id }) => id)}::int[],
        ${updatedOptions.map(({ texto }) => texto)}::text[],
        ${updatedOptions.map(({ correta }) => correta ?? false)}::boolean[],
        ${updatedOptions.map(({ posicaoCorreta }) => posicaoCorreta ?? null)}::int[]
      ) AS v(id, texto, correta, posicao_correta)
      WHERE o.id = v.id
    `;
  }

  const newOptions = optionSeeds.slice(existing.length);
  if (newOptions.length > 0) {
    await transaction.opcao.createMany({
      data: newOptions.map((option) => ({
        desafioId: challengeId,
        texto: option.texto,
        correta: option.correta ?? false,
        posicaoCorreta: option.posicaoCorreta ?? null,
      })),
    });
  }

  const obsolete = existing.slice(optionSeeds.length);
  if (obsolete.length > 0) {
    await transaction.opcao.deleteMany({
      where: { id: { in: obsolete.map(({ id }) => id) } },
    });
  }
}

async function seedContent() {
  const linguagem = await prisma.linguagem.upsert({
    where: { slug: 'html-css' },
    update: { nome: 'HTML, CSS e JavaScript', ativa: true },
    create: {
      nome: 'HTML, CSS e JavaScript',
      slug: 'html-css',
      ativa: true,
    },
  });
  const trilha = await prisma.trilha.upsert({
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

  const secondModule = await prisma.modulo.findUnique({
    where: {
      trilhaId_ordem: { trilhaId: trilha.id, ordem: 2 },
    },
    select: { id: true, titulo: true },
  });
  if (secondModule?.titulo === 'Introdução ao CSS') {
    await prisma.modulo.update({
      where: { id: secondModule.id },
      data: { ordem: 3 },
    });
  }

  const challengeIds = new Map<string, number>();
  const challengeDefinitions = new Map<string, ChallengeSeed>();

  for (const [moduleIndex, moduleSeed] of modules.entries()) {
    const moduleOrder = moduleIndex + 1;
    await prisma.$transaction(
      async (transaction) => {
        const modulo = await transaction.modulo.upsert({
          where: {
            trilhaId_ordem: { trilhaId: trilha.id, ordem: moduleOrder },
          },
          update: { titulo: moduleSeed.titulo },
          create: {
            trilhaId: trilha.id,
            titulo: moduleSeed.titulo,
            ordem: moduleOrder,
          },
        });

        for (const [lessonIndex, lessonSeed] of moduleSeed.licoes.entries()) {
          const lessonOrder = lessonIndex + 1;
          const lessonData = {
            titulo: lessonSeed.titulo,
            publicada: lessonSeed.publicada ?? true,
            tipo: lessonSeed.tipo ?? TipoLicao.CONTEUDO,
            explicacao: lessonSeed.explicacao,
            exemploCodigo: lessonSeed.exemploCodigo ?? null,
            exemploResultado: lessonSeed.exemploResultado ?? null,
          };
          const licao = await transaction.licao.upsert({
            where: {
              moduloId_ordem: { moduloId: modulo.id, ordem: lessonOrder },
            },
            update: lessonData,
            create: {
              moduloId: modulo.id,
              ordem: lessonOrder,
              ...lessonData,
            },
          });
          const desafios = lessonSeed.revisaoDe
            ? lessonSeed.revisaoDe.map((key) => {
                const source = challengeDefinitions.get(key);
                if (!source) {
                  throw new Error(`Questão de revisão não encontrada: ${key}`);
                }
                return { ...source, revisaoDe: key };
              })
            : (lessonSeed.desafios ?? []);

          for (const [challengeIndex, challengeSeed] of desafios.entries()) {
            const challengeOrder = challengeIndex + 1;
            const sourceId = challengeSeed.revisaoDe
              ? challengeIds.get(challengeSeed.revisaoDe)
              : undefined;
            if (challengeSeed.revisaoDe && !sourceId) {
              throw new Error(
                `ID da questão de revisão não encontrado: ${challengeSeed.revisaoDe}`,
              );
            }

            const challengeData = {
              tipo: challengeSeed.tipo,
              enunciado: challengeSeed.enunciado,
              explicacao: challengeSeed.explicacao,
              dica: challengeSeed.dica,
              conteudo: challengeSeed.conteudo ?? Prisma.JsonNull,
              revisaoDeId: sourceId ?? null,
              pontos: challengeSeed.pontos,
            };
            const desafio = await transaction.desafio.upsert({
              where: {
                licaoId_ordem: {
                  licaoId: licao.id,
                  ordem: challengeOrder,
                },
              },
              update: challengeData,
              create: {
                licaoId: licao.id,
                ordem: challengeOrder,
                ...challengeData,
              },
              select: { id: true },
            });

            await syncOptions(transaction, desafio.id, challengeSeed.opcoes);
            const key = referenceKey(moduleOrder, lessonOrder, challengeOrder);
            challengeIds.set(key, desafio.id);
            challengeDefinitions.set(key, challengeSeed);
          }
        }
      },
      { maxWait: 15_000, timeout: 120_000 },
    );
  }
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
