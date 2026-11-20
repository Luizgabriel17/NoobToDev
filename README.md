# NoobToDev

NoobToDev é uma aplicação web educacional para apoiar o aprendizado de programação. O conteúdo é organizado em trilhas, módulos, lições e desafios. Os estudantes podem acompanhar o próprio progresso e ganhar pontos de experiência (XP) ao resolver exercícios.

Este repositório contém a interface web, a API, o schema do banco de dados e a documentação técnica do projeto.

## Funcionalidades

- Cadastro e autenticação de estudantes.
- Trilhas com módulos e lições organizados em sequência.
- Desafios de escolha única, ordenação e escrita de código HTML/CSS.
- Validação das respostas e registro do histórico de tentativas.
- Desbloqueio progressivo de lições, acompanhamento do progresso e XP.
- Página de perfil com resumo de desempenho.
- Endpoints administrativos para manutenção de usuários e conteúdo.

## Tecnologias

- **Frontend:** Angular, TypeScript, Angular Router, Reactive Forms, RxJS, Angular CDK e Bootstrap.
- **Backend:** NestJS, TypeScript, Passport, JWT, bcrypt e class-validator.
- **Banco de dados:** PostgreSQL e Prisma ORM.
- **Testes:** Jest no backend e Vitest no frontend.

## Organização do repositório

```text
backend/
  prisma/       Schema, migrações e dados iniciais
  src/          API NestJS e regras de negócio
frontend/
  src/app/      Páginas, serviços, modelos e configuração Angular
docs/           Documentação técnica do projeto
```

## Executar localmente

### Requisitos

- Node.js e npm.
- PostgreSQL acessível pelo backend.

### Configurar o backend

1. Configure as variáveis de ambiente em `backend/.env`. Use [`.env.example`](.env.example) como referência:
   - `DATABASE_URL`: URL de conexão com o PostgreSQL.
   - `JWT_SECRET`: segredo forte para assinar os tokens de autenticação.
   - `FRONTEND_ORIGIN`: origem permitida para o frontend; normalmente `http://localhost:4200` no desenvolvimento.
2. Instale as dependências, aplique as migrações e inicie a API:

   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run start:dev
   ```

A API ficará disponível em `http://localhost:3000`.

### Configurar o frontend

Em outro terminal, instale as dependências e inicie o Angular:

```bash
cd frontend
npm install
npm start
```

A aplicação ficará disponível em `http://localhost:4200`. Para abrir em outro dispositivo conectado à mesma rede Wi-Fi, acesse `http://IP-DA-MAQUINA:4200`, substituindo pelo endereço IP local do computador que executa o projeto. O proxy de desenvolvimento encaminha as chamadas `/api/*` para a API local.

O servidor de desenvolvimento escuta em todas as interfaces e aceita o hostname usado para acessar o IP local. Use essa configuração apenas em uma rede confiável: ela não é adequada para expor o servidor à internet. Se o acesso pela rede doméstica continuar falhando, verifique se o firewall permite conexões na porta `4200` e se o roteador não isola os dispositivos Wi-Fi.

### Dados de exemplo

Para inserir o conteúdo inicial em uma base de desenvolvimento vazia, execute uma vez:

```bash
cd backend
npm run db:seed
```

O seed adiciona conteúdo de exemplo para as trilhas e os desafios. Não o execute em uma base com progresso que precise ser preservado.

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

## Documentação

- [Visão geral do sistema](docs/visao-geral.md)
- [Documentação do backend](docs/backend.md)
- [Documentação do frontend](docs/frontend.md)
- [Documentação do banco de dados](docs/banco-de-dados.md)

## Segurança e configuração

Não inclua credenciais, tokens ou valores reais de ambiente em commits ou exemplos públicos. Use valores próprios para desenvolvimento e mantenha segredos fora do repositório.
