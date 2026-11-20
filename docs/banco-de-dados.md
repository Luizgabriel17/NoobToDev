# Banco de dados

## Tecnologia e responsabilidade

O sistema usa PostgreSQL. O schema relacional e os tipos do cliente estão definidos em [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). A aplicação usa Prisma ORM para consultar e gravar dados com tipos TypeScript gerados a partir desse schema.

O Prisma não substitui as regras dos serviços: ele representa entidades, relações, índices e restrições do banco. As regras de progresso, validação de resposta e autorização são aplicadas pela API antes ou durante o acesso aos dados.

## Configuração do Prisma

O cliente Prisma é fornecido por `prisma-client-js`, e a fonte de dados é PostgreSQL. A URL da conexão vem de `DATABASE_URL`. A configuração em [`backend/prisma.config.ts`](../backend/prisma.config.ts) indica o caminho do schema, a pasta de migrações e o comando de seed. [`backend/src/prisma/prisma.service.ts`](../backend/src/prisma/prisma.service.ts) escolhe o adaptador pelo hostname: usa `@prisma/adapter-pg` para `localhost`, `127.0.0.1` e `::1`, e `@prisma/adapter-neon` nos demais casos. Para Neon, o driver serverless usa WebSockets seguros (WSS), permitindo que as conexões da aplicação passem pela porta 443 em redes que bloqueiam a porta TCP 5432. A conexão é aberta no início do módulo NestJS e fechada ao encerrar.

Os comandos do Prisma CLI, como `db:migrate` e `db push`, não usam o adaptador serverless da aplicação: conectam diretamente ao PostgreSQL por TCP e continuam sujeitos ao bloqueio da porta 5432. Execute migrações apenas em uma rede que permita essa conexão direta (por exemplo, uma rede confiável sem o bloqueio ou um ambiente de desenvolvimento com acesso ao banco). A `DATABASE_URL` permanece configurada no `.env`, que não deve ser versionado.

Comandos disponíveis na pasta `backend`:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

- `db:generate` atualiza o cliente TypeScript após mudanças no schema.
- `db:migrate` cria ou aplica migrações de desenvolvimento.
- `db:seed` executa [`backend/prisma/seed.ts`](../backend/prisma/seed.ts), que insere conteúdo de exemplo para a aplicação.

Ao alterar o schema, o fluxo esperado é editar `schema.prisma`, gerar/aplicar a migração no ambiente adequado e regenerar o cliente. As migrações existentes em `backend/prisma/migrations/` registram a evolução do banco; não substitua o histórico editando apenas a base local.

## Organização lógica dos dados

O conteúdo de aprendizagem segue esta hierarquia:

```text
Linguagem
└── Trilha
    └── Módulo
        └── Lição
            └── Desafio
                └── Opção
```

Cada relação pai-filho é mantida por uma chave estrangeira. Linguagens podem ter várias trilhas; trilhas podem ter módulos; módulos podem ter lições; lições podem ter desafios; desafios podem ter opções. A ordem é armazenada em cada nível. Restrições únicas impedem repetir a mesma ordem dentro do pai: por exemplo, a combinação de trilha e ordem é única em `Trilha`, e a de lição e ordem é única em `Desafio`.

Uma lição pode ser publicada ou não. Trilhas só são apresentadas para linguagens ativas, e o fluxo de aprendizagem carrega apenas lições publicadas. Essa separação permite preparar conteúdo sem disponibilizá-lo imediatamente.

## Tabelas e finalidade

| Modelo Prisma | Tabela | Finalidade |
| --- | --- | --- |
| `Usuario` | `usuarios` | Conta, hash da senha, papel, XP total e datas. O e-mail é único. |
| `Linguagem` | `linguagens` | Área de estudo e estado ativo. O `slug` é único. |
| `Trilha` | `trilhas` | Agrupa módulos por linguagem e possui ordem dentro da linguagem. |
| `Modulo` | `modulos` | Agrupa lições e possui ordem dentro da trilha. |
| `Licao` | `licoes` | Unidade de aprendizagem, posição no módulo e estado de publicação. |
| `Desafio` | `desafios` | Enunciado, tipo, explicação, conteúdo de apoio, pontos e ordem na lição. |
| `Opcao` | `opcoes` | Alternativas de escolha ou blocos de ordenação. |
| `ProgressoLicao` | `progresso_licao` | Estado e XP de uma lição para um usuário, além da data de conclusão. |
| `Tentativa` | `tentativas` | Resposta enviada, resultado e data de cada tentativa. |
| `AtividadeDiaria` | `atividade_diaria` | Estrutura para XP e lições concluídas por dia. |
| `Conquista` | `conquistas` | Catálogo de conquistas e XP bônus. |
| `UsuarioConquista` | `usuario_conquista` | Relação entre usuários e conquistas com data de obtenção. |

Os modelos `AtividadeDiaria`, `Conquista` e `UsuarioConquista` preparam recursos futuros. O fluxo funcional atual usa principalmente `Usuario`, o conteúdo, `ProgressoLicao` e `Tentativa`; a presença de uma tabela no schema não significa que ela já seja atualizada pela aplicação.

## Tipos de desafio

O enum `TipoDesafio` aceita `ESCOLHA_UNICA`, `ORDENACAO` e `ESCRITA_CODIGO`. `Opcao.correta` identifica a resposta da escolha única; `Opcao.posicaoCorreta` registra a posição esperada para ordenação. Em desafios de código, o campo JSON `Desafio.conteudo` guarda configuração como linguagem, orientação, código inicial e verificações. A resposta submetida é armazenada como JSON em `Tentativa.resposta`.

O uso de JSON permite que as respostas e configurações variem conforme o tipo de desafio. A estrutura esperada ainda precisa ser validada pelos DTOs e serviços; o tipo JSON do banco por si só não garante que o objeto tenha formato válido.

## Progresso, tentativas e XP

`ProgressoLicao` relaciona usuário e lição, com uma restrição única para impedir mais de um resumo de progresso da mesma lição para o mesmo usuário. O status pode ser `DISPONIVEL`, `BLOQUEADA` ou `CONCLUIDA`. A sequência de desbloqueio é calculada pela API conforme a ordem de módulos e lições; não é necessário criar previamente uma linha de progresso para cada lição.

Cada submissão gera um registro em `Tentativa`. Isso mantém histórico inclusive para respostas incorretas e permite ao serviço decidir se os desafios da lição já foram respondidos. Uma resposta correta concede os pontos apenas no primeiro acerto daquele desafio. O crédito, a tentativa e a atualização do progresso são feitos dentro de uma transação, e o XP do usuário é atualizado na mesma operação.

Em termos de integridade, o modelo de dados protege as relações principais com chaves estrangeiras, índices e unicidade. O serviço administrativo também impede exclusões de conteúdo que tenham progresso ou tentativas relacionadas, preservando o histórico dos estudantes.

## Convenções de nomes e relações

Os nomes dos modelos e campos no Prisma são legíveis em TypeScript; `@map` e `@@map` os conectam às convenções do banco. Por exemplo, `senhaHash` mapeia para a coluna `senha_hash` e `Usuario` para a tabela `usuarios`. Isso permite manter nomes claros no código sem alterar os nomes já usados no PostgreSQL.

As relações definem regras de exclusão. Conteúdo hierárquico e opções usam cascata em pontos nos quais a exclusão do pai deve remover filhos. As relações do histórico do usuário podem ser removidas junto com o usuário; já lições e desafios relacionados a progresso ou tentativas usam restrições que protegem registros históricos. Antes de alterar `onDelete`, verifique o efeito em dados já gravados e nas rotinas administrativas.
