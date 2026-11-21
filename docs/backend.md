# Backend

## Papel do backend

O backend é uma API HTTP feita com NestJS e TypeScript. Ele recebe as chamadas do Angular, valida os dados, aplica as regras de autenticação e aprendizagem e consulta ou altera o PostgreSQL por meio do Prisma.

O ponto de entrada é [`backend/src/main.ts`](../backend/src/main.ts). Nele são configurados:

- o carregamento dos módulos da aplicação;
- a validação global dos dados recebidos;
- o CORS, limitado à origem definida em `FRONTEND_ORIGIN`;
- a porta da API, definida por `PORT` ou, por padrão, `3000`.

O `ValidationPipe` global usa `whitelist` e `transform`: propriedades que não fazem parte do DTO são descartadas e os tipos podem ser convertidos para o tipo declarado. A configuração geral e os módulos registrados ficam em [`backend/src/app.module.ts`](../backend/src/app.module.ts).

## Organização do código

Cada diretório em `backend/src` agrupa uma parte da aplicação:

| Diretório | Responsabilidade |
| --- | --- |
| `auth/` | Cadastro, login, emissão e validação de JWT, além de papéis e proteção de rotas. |
| `users/` | Operações administrativas de consulta e manutenção de usuários. |
| `admin/` | Operações administrativas do conteúdo: linguagens, trilhas, módulos, lições e desafios. |
| `trilhas/` | Montagem da lista de trilhas e dos estados de progresso das lições do estudante. |
| `licoes/` | Carregamento de uma lição disponível, seus desafios e opções públicas. |
| `desafios/` | Recebimento, avaliação e registro das respostas. |
| `progress/` | Regras compartilhadas de acesso, conclusão, avaliação das respostas e XP. |
| `perfil/` | Resumo do perfil e do progresso do usuário. |
| `lessons/` | Rotas de manutenção e consulta de lições no caminho legado `/lessons`. |
| `prisma/` | Cliente compartilhado e conexão com o banco de dados. |

O padrão de um recurso NestJS é separar o `*.controller.ts` (rotas HTTP), o `*.service.ts` (regras e acesso a dados), o `*.module.ts` (injeção de dependências) e, quando necessário, `dto/` (formato e validação dos dados). Para adicionar uma regra de negócio, prefira implementá-la no serviço correspondente; mantenha o controller responsável por receber a requisição e encaminhá-la.

O [`backend/src/prisma/prisma.service.ts`](../backend/src/prisma/prisma.service.ts) estende o `PrismaClient`, conecta quando o módulo inicia e desconecta quando ele é encerrado. Ele usa `@prisma/adapter-pg` com a variável `DATABASE_URL`. O módulo Prisma é global para que os demais recursos possam injetar o serviço.

## Fluxo principal

1. O Angular chama a API por meio de `/api`; em desenvolvimento, o proxy remove esse prefixo e encaminha a chamada para `http://localhost:3000`.
2. O controller valida parâmetros e DTOs e, nas rotas protegidas, exige um JWT.
3. O serviço de domínio executa as regras e usa `PrismaService` para ler ou gravar os dados.
4. A API devolve um DTO ou uma resposta HTTP adequada. Erros de validação, autenticação, permissão e ausência de registros são convertidos em respostas NestJS, como `400`, `401`, `403` e `404`.

## Autenticação e autorização

O cadastro e o login estão em [`backend/src/auth/auth.controller.ts`](../backend/src/auth/auth.controller.ts):

- `POST /auth/register`: cria um estudante. O e-mail é normalizado para minúsculas e espaços externos são removidos. A senha é armazenada como hash bcrypt; o hash nunca é devolvido.
- `POST /auth/login`: verifica a senha e devolve `accessToken` e dados públicos do usuário.
- `GET /auth/me`: devolve os dados públicos do usuário autenticado.

O JWT é assinado com `JWT_SECRET` e expira após sete dias. A estratégia em `auth/jwt.strategy.ts` lê o token do cabeçalho `Authorization: Bearer ...` e disponibiliza usuário e papel em `req.user`. O `JwtAuthGuard` autentica; o `RolesGuard` junto com o decorador `@Roles` restringe rotas por papel (`ESTUDANTE` ou `ADMIN`).

## Rotas principais

As rotas abaixo são caminhos da API no backend, sem o prefixo de proxy `/api` usado pelo navegador:

| Rota | Acesso | Uso |
| --- | --- | --- |
| `POST /auth/register` | Público | Cadastro. |
| `POST /auth/login` | Público | Login e emissão do token. |
| `GET /auth/me` | Autenticado | Dados do usuário atual. |
| `GET /trilhas` | Autenticado | Trilhas ativas, módulos, lições publicadas e situação do progresso. |
| `GET /licoes/:id` | Autenticado | Detalhes de uma lição acessível e seus desafios. |
| `POST /desafios/:id/respostas` | Autenticado | Avalia e registra uma tentativa. |
| `GET /perfil` | Autenticado | Dados do perfil e resumo do progresso. |
| `GET /admin/linguagens` e `/admin/linguagens/:id`; `POST /admin/linguagens`; `PATCH` e `DELETE /admin/linguagens/:id` | Administrador | Consulta e manutenção de linguagens. |
| Mesma estrutura em `/admin/trilhas`, `/admin/modulos`, `/admin/licoes` e `/admin/desafios` | Administrador | Consulta e manutenção do conteúdo didático. Cada recurso oferece listagem, consulta por ID, criação, atualização parcial e exclusão. |
| `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` | Administrador | Manutenção de usuários. |

As rotas de conteúdo e de usuário têm detalhes de parâmetros e DTOs em seus controllers e serviços. O recurso `lessons/` também expõe `GET /lessons`, `GET /lessons/:id` e operações de escrita para administradores. Esse caminho usa o mesmo modelo de lição, mas não é o fluxo usado pela interface atual; o aprendizado usa `/trilhas`, `/licoes/:id` e `/desafios/:id/respostas`.

## Regras de aprendizagem

As regras centrais estão em [`backend/src/progress/progress.service.ts`](../backend/src/progress/progress.service.ts):

- As lições são ordenadas por módulo e pela ordem dentro do módulo. A primeira fica disponível; as seguintes permanecem bloqueadas até que a lição anterior seja concluída.
- O acesso é conferido no servidor, mesmo que a interface também mostre visualmente as lições bloqueadas.
- Os tipos de desafio incluem escolha única, ordenação, escrita de código, completar lacunas e identificar um erro.
- Em escolha única e identificação de erro, a opção enviada precisa pertencer ao desafio e ser a opção correta para contar como acerto.
- Em ordenação, a resposta precisa conter cada opção exatamente uma vez e na sequência correta.
- Em lacunas, o servidor compara a resposta normalizada com as respostas aceitas configuradas. Em escrita de código, critérios HTML são avaliados após parse e CSS por verificações estáticas; o conteúdo enviado nunca é executado.
- Uma resposta correta concede os pontos do desafio somente na primeira vez que aquele usuário acerta aquele desafio. Tentativas posteriores continuam registradas, mas não repetem o XP.
- Para concluir uma lição, todos os desafios precisam ser acertados. Respostas incorretas incluem explicação e dica quando configuradas, não revelam o gabarito e podem ser tentadas novamente.
- O envio da resposta, o histórico de tentativa, o progresso da lição e o total de XP são tratados em transação. O registro do usuário é bloqueado durante a operação para evitar crédito duplicado em envios simultâneos.

Ao alterar essas regras, atualize os testes do `progress`, `desafios` ou recurso afetado e confira se a API e a interface continuam usando os mesmos nomes de tipos e campos.

## Validação e conteúdo administrativo

Os DTOs ficam em `auth/*.dto.ts`, `desafios/dto/` e `admin/dto/`. Eles declaram campos aceitos e usam `class-validator`; os controllers também convertem IDs de rota em inteiros. A validação de conteúdo administrativo inclui regras de consistência, como exatamente uma opção correta para escolha única ou identificação de erro, posição distinta para cada opção de ordenação e critérios obrigatórios para exercícios de código ou lacunas.

As exclusões administrativas verificam se há progresso ou tentativas relacionadas antes de remover conteúdo que apagaria histórico. Respeite essa proteção ao criar novos caminhos de exclusão ou alterar relações.

## Configuração e comandos

Crie `backend/.env` com `DATABASE_URL`, `JWT_SECRET` forte e, se necessário, `PORT` e `FRONTEND_ORIGIN`. A referência de nomes é [`.env.example`](../.env.example). Não registre valores reais de ambiente no controle de versão.

Na pasta `backend`, os comandos existentes incluem:

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:migrate` aplica e cria migrações no ambiente de desenvolvimento; `db:generate` gera o cliente Prisma. O seed popula conteúdo inicial e não deve ser executado numa base cujo progresso precise ser preservado.
