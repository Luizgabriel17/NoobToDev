# Visão geral do NoobToDev

## O que é o sistema

NoobToDev é uma aplicação de aprendizagem de programação organizada em trilhas, módulos, lições e desafios. O estudante cria uma conta, acessa o conteúdo publicado, responde exercícios e acompanha o progresso e o XP no perfil. A API também oferece operações de administração para manter usuários e conteúdo.

## Tecnologias

| Parte | Tecnologias principais |
| --- | --- |
| Interface | Angular 22, TypeScript, Angular Router, Reactive Forms, signals, RxJS, Angular CDK e Bootstrap. |
| API | NestJS 12, TypeScript, Passport/JWT, bcrypt e `class-validator`. |
| Persistência | PostgreSQL, Prisma ORM, cliente Prisma e adaptador PostgreSQL. |
| Testes | Jest no backend; Vitest integrado ao builder Angular no frontend. |

As versões listadas refletem os manifests atuais de dependências. Consulte [`backend/package.json`](../backend/package.json) e [`frontend/package.json`](../frontend/package.json) ao atualizar tecnologias ou comandos.

## Como as partes trabalham juntas

1. O estudante navega pela aplicação Angular e envia formulários ou respostas de desafios.
2. O frontend chama a API usando caminhos `/api/...`. No desenvolvimento, o proxy do Angular encaminha a chamada ao backend em `localhost:3000`.
3. O backend valida DTOs, confirma autenticação e permissões, aplica as regras de negócio e usa Prisma para acessar o PostgreSQL.
4. A API devolve dados de trilhas, progresso, perfil ou o resultado de uma tentativa. A interface atualiza a tela com os dados recebidos.

O frontend não é a fonte oficial dos dados: o progresso, a avaliação de respostas, a autorização e a contagem de XP são decididos pelo backend e persistidos no banco.

## Funcionalidades principais

- Cadastro e login com senha armazenada como hash e sessão baseada em JWT.
- Listagem de trilhas ativas, módulos e lições publicadas.
- Desbloqueio sequencial de lições de acordo com o progresso.
- Desafios de escolha única, ordenação, completar lacunas, identificar erros e escrita de código HTML/CSS.
- Conteúdo didático, exemplos, projetos e revisões armazenados no banco; dicas após respostas incorretas.
- Histórico de tentativas, conclusão de lições e pontos de experiência.
- Perfil com total de XP e resumo de lições concluídas.
- Endpoints administrativos para manutenção de linguagens, trilhas, módulos, lições, desafios e usuários.

O schema também prevê atividade diária e conquistas; esses modelos são uma base para evoluções e não devem ser apresentados como funcionalidades ativas sem verificar se foram implementados nos serviços e na interface.

## Onde desenvolver

| Tipo de mudança | Local inicial |
| --- | --- |
| Nova tela ou comportamento visual | `frontend/src/app/features/` |
| Rota da interface | `frontend/src/app/app.routes.ts` |
| Chamada HTTP ou estado compartilhado | `frontend/src/app/services/` |
| Tipo de dado usado pela interface | `frontend/src/app/models/` |
| Validação comum, guard ou interceptor | `frontend/src/app/core/` |
| Nova rota de API | Controller e módulo do recurso em `backend/src/` |
| Regra de negócio | Serviço do recurso em `backend/src/`; regras compartilhadas de aprendizagem em `backend/src/progress/` |
| Formato/validação da entrada da API | DTO do recurso, usando os validadores já adotados |
| Persistência ou relação nova | `backend/prisma/schema.prisma` e migração correspondente |
| Conteúdo inicial para desenvolvimento | `backend/prisma/seed.ts` |

Em alterações que cruzem camadas, mantenha contrato consistente: schema e migração, DTO e serviço da API, modelo e serviço Angular e, por fim, componente de interface. Por exemplo, criar um tipo de desafio demanda definir como seu conteúdo e resposta serão armazenados, validados, avaliados e apresentados.

## Organização do repositório

```text
backend/
  prisma/          Schema, migrações e seed
  src/
    auth/          Autenticação e autorização
    admin/         Administração do conteúdo
    progress/      Regras de progresso e XP
    ...            Demais módulos de domínio
frontend/
  src/app/
    core/          Infraestrutura transversal
    features/      Páginas e funcionalidades
    models/        Contratos TypeScript
    services/      Integração HTTP e estado
docs/              Documentação do projeto
```

## Executar localmente

É necessário ter Node.js/npm e uma instância PostgreSQL acessível. Na raiz, use [`.env.example`](../.env.example) como referência e crie `backend/.env` com:

- `DATABASE_URL`: URL de conexão com o PostgreSQL;
- `JWT_SECRET`: segredo forte usado para assinar tokens;
- `FRONTEND_ORIGIN`: origem permitida pelo CORS (em desenvolvimento, `http://localhost:4200`).

Em um terminal:

```bash
cd backend
npm install
npm run db:migrate
npm run start:dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. O proxy configurado no Angular envia as chamadas para a API local. Para popular uma base de desenvolvimento vazia, execute `npm run db:seed` na pasta `backend` depois das migrações. O seed insere conteúdo inicial e não deve ser executado em uma base com progresso que precise ser preservado.

## Comandos úteis

Na pasta `backend`:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
npm run db:generate
npm run db:migrate
```

Na pasta `frontend`:

```bash
npm run build
npm test
```

Use os testes do módulo alterado primeiro. Mudanças na forma de responder desafios, persistência ou sequência de desbloqueio devem também ser verificadas contra os testes de progresso e serviços relacionados.
