# NoobToDev — diário de bordo e glossário

Este arquivo registra, em formato de checklist, o trabalho realizado no
NoobToDev entre **16/11/2026 e 20/11/2026**, além das decisões técnicas,
configurações de segurança e termos que podem ser novos para quem está
aprendendo programação.

As datas resumem o histórico do Git e as etapas de trabalho registradas no
projeto. Os marcos consultados estão concentrados em 16/11 e 20/11; não há
registro suficiente para atribuir atividades específicas a cada dia
intermediário. O checklist descreve o estado do repositório em 20/11/2026; ele
não substitui o código, as migrations ou a documentação técnica específica.

## 1. Resumo do projeto

O NoobToDev é uma plataforma web de aprendizagem de programação, com trilhas,
módulos, lições, desafios, progresso e pontos de experiência (XP). O objetivo
pedagógico é ensinar programação do zero com conteúdos em português do Brasil,
começando por HTML, CSS e JavaScript.

### Stack escolhida

- [x] **Frontend:** Angular 22 e TypeScript.
- [x] **Navegação:** Angular Router.
- [x] **Formulários e estado:** Reactive Forms, RxJS e Angular signals.
- [x] **Componentes de interface:** Angular CDK e Bootstrap.
- [x] **Backend/API:** NestJS 12 e TypeScript.
- [x] **Autenticação:** Passport, JWT e bcrypt.
- [x] **Validação de dados da API:** `class-validator`.
- [x] **Banco relacional:** PostgreSQL hospedado no Neon.
- [x] **Acesso ao banco:** Prisma ORM, Prisma Client e adaptador PostgreSQL.
- [x] **Testes:** Jest no backend e Vitest integrado ao builder Angular no
  frontend.
- [x] **Parsing/validação de código:** parse5 para estrutura HTML e Acorn para
  análise estática de JavaScript.

Os manifests em `backend/package.json` e `frontend/package.json` são a
referência atual de dependências e scripts.

## 2. Linha do tempo — checklist de entregas

### 16/11/2026 — fundação da aplicação

- [x] Criação e consolidação do fluxo principal da aplicação.
- [x] Separação do projeto em `frontend/`, `backend/` e `docs/`.
- [x] Definição da stack Angular + NestJS + TypeScript + PostgreSQL + Prisma.
- [x] Implementação inicial da API e conexão entre frontend e backend.
- [x] Criação do fluxo de cadastro, login, perfil e proteção de rotas.
- [x] Primeiras telas e componentes para navegação da aplicação.
- [x] Modelagem inicial do banco e elaboração do DER (Diagrama Entidade-
  Relacionamento).
- [x] Organização inicial de trilhas, módulos, lições, desafios, opções,
  tentativas, progresso e XP.
- [x] Criação/expansão de exercícios e conteúdos iniciais por meio de seed.
- [x] Escrita da documentação inicial do projeto.
- [x] Criação do `.env.example` e regras de `.gitignore` para não versionar
  arquivos de ambiente com segredos.

### 20/11/2026 — aprofundamento da trilha e experiência de aprendizagem

#### Fase 0 — leitura e plano

- [x] Inspeção do schema Prisma, seed, módulos do backend, telas do frontend e
  documentação antes de alterar o produto.
- [x] Definição de fases e requisitos pedagógicos/técnicos.
- [x] Aprovação do plano antes de começar as mudanças de conteúdo.

#### Fase 1 — modelo de conteúdo e regras de aprendizagem

- [x] Expansão compatível do schema e criação/aplicação de migration para
  suportar explicação, exemplos guiados, tipo de lição, dica e configuração
  específica de desafios.
- [x] Inclusão dos tipos de lição `CONTEUDO`, `PROJETO` e `REVISAO`.
- [x] Inclusão dos tipos de desafio `COMPLETAR_LACUNAS` e `ENCONTRAR_ERRO`,
  mantendo escolha única, ordenação e escrita de código.
- [x] Inclusão da relação entre uma questão de revisão e sua questão de origem.
- [x] Atualização da API para retornar conteúdo didático público, mantendo
  gabaritos e verificações privadas no servidor.
- [x] Preservação da correção, progressão sequencial e cálculo de XP no backend.
- [x] Atualização dos contratos e tipos usados pelo frontend.

#### Fase 2 — currículo e seed

- [x] Criação de um currículo com cinco módulos publicados:
  HTML essencial, HTML semântico, CSS essencial, Layout moderno e JavaScript
  básico.
- [x] Estruturação de três módulos futuros como “em breve”: JavaScript no
  navegador, TypeScript introdutório e Ferramentas profissionais.
- [x] Organização dos módulos com lições de conteúdo, revisão espaçada e
  projeto prático, em vez de somente perguntas curtas.
- [x] Criação de explicações, exemplos comentados, enunciados, alternativas,
  respostas aceitas, dicas, feedback e critérios de validação no seed/banco.
- [x] Reestruturação do seed para atualizar registros existentes e preservar
  IDs e histórico; sincronização de opções em lote e transações por módulo.
- [x] Execução do seed duas vezes para verificar que ele pode ser repetido.
- [x] Na verificação registrada: 44 lições, 159 desafios e 332 opções; os
  2 usuários, 6 progressos e 20 tentativas existentes permaneceram.
- [x] Implementação de validação estrutural HTML e análise estática de
  JavaScript sem executar o código enviado pelo estudante.

#### Correções decorrentes do uso dos exercícios

- [x] Adição de campo de texto para questões do tipo completar lacunas na
  interface da lição. Antes, a API já fornecia esse tipo de exercício, mas a
  tela não mostrava o controle para responder.
- [x] Correção do rótulo e da apresentação do tipo “Encontrar o erro”.
- [x] Ajuste da validação de `alt`: uma descrição útil não precisa ser
  literalmente igual ao texto usado como exemplo/gabarito.
- [x] Inclusão de teste de regressão para o exemplo de link da MDN e imagem com
  descrição alternativa.

#### Fase 3 — telas da lição e da trilha

- [x] Exibição da mini-explicação, exemplo de código e resultado guiado,
  usando os dados recebidos da API.
- [x] Pré-visualização de exemplos e exercícios HTML/CSS em `iframe` com
  sandbox.
- [x] Atualização ao vivo da prévia para o código HTML/CSS digitado.
- [x] Aviso de que JavaScript é analisado estaticamente e não é executado.
- [x] Identificação visual de projetos, revisões, XP por lição/módulo e
  módulos “em breve”.
- [x] Diferenciação visual de um módulo futuro de um módulo inesperadamente
  vazio.
- [x] Melhorias de acessibilidade, como rótulos, regiões, descrição de
  progresso e anúncios de feedback.
- [x] A entrega da interface consta no histórico do Git em 20/11/2026.

#### Fase 4 — validação integrada e fechamento

- [ ] Fazer revisão final do diff e confirmar contratos frontend/backend.
- [ ] Executar novamente builds, lint e testes disponíveis para o estado mais
  recente do repositório.
- [ ] Confirmar que gabaritos e verificações privadas não aparecem nas
  respostas públicas da API.
- [ ] Confirmar que nenhum código JavaScript submetido pelo aluno é executado.
- [ ] Testar manualmente o fluxo completo de erro, dica, nova tentativa,
  acerto, XP, progresso, projeto, revisão e prévia HTML/CSS.
- [ ] Verificar seed e migrations somente em banco local/de teste seguro; não
  executar seed contra produção ou banco remoto sem autorização explícita.
- [ ] Registrar os resultados e limitações de cada validação.

## 3. Banco de dados e modelagem

### Banco e conexão

- [x] PostgreSQL escolhido como banco relacional.
- [x] Neon configurado como provedor PostgreSQL hospedado.
- [x] Prisma usado para descrever o modelo, gerar o cliente e aplicar
  migrations.
- [x] A configuração lê `DATABASE_URL` do ambiente. O endereço real de conexão
  não deve ser registrado neste documento.
- [x] A configuração do Prisma fica em `backend/prisma.config.ts`; o schema
  está em `backend/prisma/schema.prisma`.
- [x] O histórico contém três migrations: schema inicial, suporte inicial a
  desafio de código e expansão do conteúdo de aprendizagem.
- [x] A migration de expansão do conteúdo foi aplicada ao banco durante o
  trabalho da fase 1; o status foi verificado então.

### Relações principais

```text
Linguagem
  └── Trilha
        └── Módulo
              └── Lição
                    └── Desafio
                          └── Opção

Usuário
  ├── Progresso por lição
  ├── Tentativas de desafios
  ├── Atividade diária
  └── Conquistas
```

### Tabelas/modelos principais do Prisma

- [x] `Usuario`: conta, papel, hash de senha e XP total.
- [x] `Linguagem`: linguagem/tecnologia e estado ativo.
- [x] `Trilha`: caminho de aprendizagem associado a uma linguagem.
- [x] `Modulo`: agrupamento sequencial dentro de uma trilha.
- [x] `Licao`: título, posição, publicação, tipo, explicação e exemplo.
- [x] `Desafio`: enunciado, tipo, dica, explicação, pontos e configuração JSON.
- [x] `Opcao`: alternativas ou blocos ordenáveis; a correção fica somente no
  banco/backend.
- [x] `ProgressoLicao`: estado, XP ganho e data de conclusão por estudante.
- [x] `Tentativa`: resposta enviada, resultado e data; usada como histórico.
- [x] `AtividadeDiaria`, `Conquista`, `UsuarioConquista`: estruturas para
  evolução de atividade e conquistas; a presença no schema não significa que
  toda a experiência relacionada esteja ativa na interface.

### Regras de dados importantes

- [x] As posições de trilhas, módulos e lições determinam a ordem.
- [x] Há restrições de unicidade para evitar repetir ordens dentro do mesmo
  contexto e para não duplicar progresso do mesmo usuário/ lição.
- [x] O estado da lição (`DISPONIVEL`, `BLOQUEADA`, `CONCLUIDA`) é calculado
  com base na sequência e no progresso.
- [x] Lições não publicadas não aparecem para estudantes.
- [x] O XP e a resposta correta são decididos no servidor.
- [x] O seed é a fonte dos dados didáticos iniciais; o schema não contém as
  explicações nem os gabaritos em código do frontend.

## 4. Seed e conteúdo pedagógico

O arquivo `backend/prisma/seed.ts` preenche/atualiza o banco com os dados
iniciais da trilha. Ele contém textos didáticos e definições de desafios,
opções, respostas aceitas e verificações.

- [x] O seed cria ou sincroniza linguagem, trilha, módulos, lições, desafios e
  opções.
- [x] O seed sincroniza por posição e mantém IDs existentes quando os registros
  correspondentes já existem.
- [x] Questões de revisão apontam para questões de origem.
- [x] Projetos são lições identificadas pelo tipo, não apenas pelo título.
- [x] Os módulos futuros têm lições estruturadas, mas não publicadas.
- [x] A execução repetida foi testada duas vezes no ambiente usado para a
  validação, sem apagar os dados de usuários/progresso/tentativas verificados.
- [ ] Antes de executar o seed em outro ambiente, confirmar que é um banco
  descartável/de desenvolvimento e que não há progresso a preservar.

### Política de avaliação dos desafios

- [x] **Escolha única:** o servidor confere o ID da opção.
- [x] **Ordenação:** o servidor compara a sequência dos IDs com a ordem correta.
- [x] **Completar lacunas:** o servidor normaliza resposta e compara com
  respostas aceitas privadas.
- [x] **Encontrar erro:** a seleção é corrigida no servidor como uma questão de
  escolha.
- [x] **HTML:** parse da estrutura e verificação de elementos/atributos, sem
  exigir que todo o código seja texto idêntico.
- [x] **CSS:** verificações estruturais configuradas por desafio.
- [x] **JavaScript:** parse estático com Acorn; nenhum código do aluno é
  executado.
- [x] Erros retornam feedback/dica sem entregar a resposta correta.
- [x] O aluno pode tentar novamente; só a resposta correta permite avançar.
- [x] XP é concedido pelo servidor na primeira resposta correta, sem duplicação
  por repetição.

## 5. Documentação e arquivos de configuração

### Documentação criada/atualizada

- [x] `README.md`: apresentação, tecnologias, configuração local e comandos.
- [x] `docs/visao-geral.md`: arquitetura, fluxo entre camadas e onde alterar o
  projeto.
- [x] `docs/backend.md`: módulos, API e regras de negócio do servidor.
- [x] `docs/frontend.md`: páginas, integração, formulários e fluxo de interface.
- [x] `docs/banco-de-dados.md`: banco, modelo e migrations.
- [x] `docs/API/contract.md`: formato das rotas e payloads.
- [x] `docs/divino.md`: este checklist histórico e glossário para iniciantes.

### Ambiente e proteção de segredos

- [x] `.env.example` documenta os nomes esperados das variáveis sem fornecer
  credenciais reais.
- [x] `backend/.env` é o local esperado para os valores de ambiente usados pelo
  backend em desenvolvimento.
- [x] `.gitignore` ignora `.env`, dependências instaladas, artefatos de build,
  logs e outros arquivos locais.
- [x] `DATABASE_URL` deve conter a conexão PostgreSQL; `JWT_SECRET` deve ser um
  segredo forte; `FRONTEND_ORIGIN` define a origem permitida pelo CORS.
- [x] Nenhuma senha, chave JWT ou URL de conexão real deve ser escrita neste
  arquivo, em documentação pública ou em commits.
- [x] O frontend em desenvolvimento usa proxy para encaminhar `/api` ao
  backend local.
- [x] O servidor Angular aceita acesso na rede local para teste em outros
  dispositivos; isso é apenas para redes confiáveis e não deve ser exposto
  diretamente à internet.

### Configurações e capacidades intencionalmente limitadas/bloqueadas

- [x] **Segredos:** arquivos `.env` ficam fora do Git; somente nomes de
  variáveis e valores vazios/de exemplo podem ser publicados.
- [x] **Módulos futuros:** JavaScript no navegador, TypeScript e Ferramentas
  profissionais estão estruturados, mas não publicados para os estudantes.
- [x] **Progressão:** o backend bloqueia lições posteriores até a conclusão da
  anterior.
- [x] **Gabaritos:** o frontend não recebe `correta`, `posicaoCorreta`,
  respostas aceitas de lacunas nem critérios de código.
- [x] **Execução de JavaScript:** está desativada intencionalmente. O conteúdo
  passa por análise estática, não por execução.
- [x] **Prévia:** a renderização HTML/CSS ocorre em `iframe` sandboxed sem
  permissão para scripts. A prévia não é um ambiente para executar código
  arbitrário.
- [x] **Administração:** endpoints administrativos exigem autorização de
  administrador; não há uma tela administrativa no conjunto atual de rotas
  frontend.
- [ ] **Validação integrada final:** builds/testes e fluxo ponta a ponta devem
  ser repetidos para a versão mais recente. Em tentativas anteriores, Vitest
  encerrou com `Illegal instruction`/SIGILL; registrar se isso persistir, sem
  declarar o teste aprovado.
- [ ] **Produção:** não executar seed, migrations ou alterações destrutivas
  contra banco remoto/de produção sem confirmação, backup e autorização.

## 6. Glossário técnico para iniciantes

### Aplicação, interface e rede

- **API (Application Programming Interface):** conjunto de caminhos e regras
  que permite ao frontend pedir dados ou enviar respostas ao backend.
- **Backend:** parte do sistema executada no servidor; valida entradas, aplica
  regras, acessa o banco e responde à API.
- **Frontend:** parte que roda no navegador e apresenta telas e controles ao
  estudante.
- **Angular:** framework usado para construir a interface em componentes.
- **Componente:** unidade de interface; normalmente combina TypeScript, HTML e
  CSS para representar uma página ou parte dela.
- **Template:** HTML de um componente, com marcação Angular para mostrar dados e
  reagir a ações.
- **CSS:** linguagem que define aparência, cores, espaçamentos e layout.
- **HTML:** linguagem de marcação que organiza o conteúdo de uma página.
- **JavaScript:** linguagem de programação que pode dar comportamento a páginas
  e aplicações. Neste projeto, respostas de JavaScript são analisadas, não
  executadas.
- **TypeScript:** JavaScript com sintaxe de tipos que ajuda a detectar
  inconsistências durante o desenvolvimento.
- **HTTP:** protocolo usado pelo navegador e pela API para trocar requisições e
  respostas.
- **JSON:** formato textual de dados usado nos corpos de muitas requisições e
  respostas da API.
- **Endpoint/rota:** endereço e método HTTP que executam uma operação, por
  exemplo `GET /trilhas`.
- **REST:** estilo comum de organizar APIs ao redor de recursos e métodos HTTP.
- **CORS:** regra do navegador que controla quais origens podem fazer chamadas
  à API.
- **Proxy de desenvolvimento:** encaminhamento local que permite ao frontend
  acessar a API por um caminho conhecido, evitando configurar manualmente cada
  chamada durante o desenvolvimento.
- **iframe:** elemento HTML que incorpora outra página dentro da página atual.
  Aqui é usado para isolar a prévia visual de HTML/CSS.
- **sandbox:** conjunto de restrições aplicado ao `iframe`; reduz o que o
  conteúdo incorporado pode fazer. Nesta aplicação, não se concede permissão
  para executar scripts.
- **DOM (Document Object Model):** representação em árvore da página HTML que
  navegadores usam para exibir e permitir interação com o documento.

### Backend, autenticação e validação

- **NestJS:** framework de backend usado para organizar a API em módulos,
  controllers e serviços.
- **Controller:** camada que recebe a requisição HTTP e encaminha os dados para
  a regra apropriada.
- **Service/serviço:** camada que contém a lógica de negócio, como corrigir uma
  resposta ou calcular XP.
- **Module/módulo NestJS:** agrupamento de controllers, serviços e dependências
  relacionados a uma área.
- **DTO (Data Transfer Object):** objeto que define quais dados entram ou saem
  de uma operação da API. DTOs também podem validar formato, tamanho e tipo.
- **`class-validator`:** biblioteca usada para validar propriedades de DTOs no
  backend.
- **Guard:** componente de autorização que decide se uma requisição pode
  acessar uma rota, por exemplo, se há usuário autenticado ou papel adequado.
- **JWT (JSON Web Token):** token assinado que representa uma sessão/autorização
  em requisições autenticadas.
- **bcrypt:** algoritmo usado para transformar senhas em hashes apropriados
  para armazenamento; a senha original não deve ser salva no banco.
- **Hash:** resultado de uma transformação de mão única usada para comparar
  credenciais sem guardar o texto original da senha.
- **Parser/analisador:** ferramenta que lê código e cria uma representação
  estruturada para verificar sua sintaxe ou conteúdo.
- **AST (Abstract Syntax Tree):** árvore que representa a estrutura do código
  depois de analisado. Acorn usa uma AST para analisar JavaScript sem executá-lo.
- **parse5:** biblioteca que analisa HTML em uma estrutura de elementos,
  permitindo verificar tags e atributos.
- **Acorn:** parser JavaScript usado para análise estática de sintaxe e
  estrutura, sem rodar o código submetido pelo estudante.
- **Validação estática:** inspeção do código sem executá-lo.
- **XP:** pontos de experiência concedidos por desafios corretos conforme a
  regra no servidor.

### Banco de dados e Prisma

- **PostgreSQL:** sistema gerenciador de banco de dados relacional.
- **Neon:** serviço de banco PostgreSQL hospedado na nuvem.
- **Banco relacional:** banco que organiza dados em tabelas conectadas por
  relações.
- **Tabela/modelo:** conjunto de registros do mesmo tipo; no Prisma, um `model`
  descreve a tabela e seus campos.
- **Schema:** descrição da estrutura dos dados, tipos, tabelas e relações.
- **Prisma:** ORM usado para mapear modelos do código para tabelas e consultar o
  PostgreSQL.
- **ORM (Object-Relational Mapping):** ferramenta que conecta objetos/modelos
  da aplicação a tabelas relacionais.
- **Prisma Client:** cliente gerado a partir do schema, com métodos tipados para
  acessar o banco.
- **Migration:** arquivo versionado de alteração da estrutura do banco; permite
  aplicar mudanças de forma repetível.
- **Seed:** script de dados iniciais/de exemplo. Neste projeto, também
  sincroniza o currículo definido no arquivo de seed.
- **Idempotente:** operação que pode ser executada mais de uma vez sem criar
  duplicatas ou corromper o resultado esperado.
- **Chave primária (PK):** identificador único de um registro.
- **Chave estrangeira (FK):** campo que aponta para um registro relacionado em
  outra tabela.
- **Relação:** ligação entre modelos, como uma trilha contendo módulos ou um
  usuário possuindo progresso.
- **Enum:** lista fechada de valores permitidos, como os tipos de desafio.
- **Índice:** estrutura que ajuda o banco a localizar registros com mais
  eficiência.
- **Transação:** conjunto de operações no banco que deve ser confirmado em
  conjunto; em caso de falha, pode ser revertido.
- **DER:** Diagrama Entidade-Relacionamento; desenho dos modelos/tabelas e das
  relações entre eles.
- **CRUD:** abreviação de Create, Read, Update, Delete — criar, consultar,
  atualizar e excluir.
- **SQL:** linguagem usada para consultar e modificar bancos relacionais.
- **Progresso:** registro persistido do estado de aprendizagem de uma pessoa.
- **Tentativa:** histórico de uma resposta enviada para um desafio, incluindo
  se foi correta.

### Arquivos, configuração e qualidade

- **`.env`:** arquivo local de variáveis de ambiente, como URLs de banco e
  segredos. Não deve ser compartilhado nem commitado.
- **`.env.example`:** modelo seguro que lista nomes de variáveis esperadas; não
  deve conter credenciais reais.
- **`.gitignore`:** arquivo com padrões que o Git deve ignorar, como `.env`,
  `node_modules/`, logs e resultados de build.
- **`README.md`:** documento inicial do repositório com apresentação,
  instalação, execução e comandos.
- **Markdown (`.md`):** formato de texto simples usado para documentação, com
  títulos, listas, links e blocos de código.
- **`package.json`:** manifesto Node.js com scripts, metadados e dependências
  do projeto.
- **`package-lock.json`:** fixa a resolução das dependências npm para que
  instalações usem versões compatíveis e repetíveis.
- **`node_modules/`:** diretório criado pela instalação npm com as bibliotecas
  do projeto; não deve ser versionado.
- **Variável de ambiente:** valor fornecido ao processo sem precisar gravá-lo
  diretamente no código.
- **`DATABASE_URL`:** variável com o endereço de conexão ao PostgreSQL.
- **`JWT_SECRET`:** segredo usado pelo backend para assinar tokens; deve ser
  longo, aleatório e privado.
- **`FRONTEND_ORIGIN`:** endereço autorizado para acessar a API via navegador.
- **Build/compilação:** transformação e verificação do código para produzir a
  aplicação executável/publicável.
- **Lint:** análise automática de código que aponta problemas e inconsistências
  comuns.
- **Type-check/verificação de tipos:** checagem de compatibilidade entre os
  tipos TypeScript.
- **Teste unitário:** teste de uma parte pequena, como uma função ou serviço.
- **Teste de integração:** teste que verifica a comunicação entre partes do
  sistema.
- **Vitest/Jest:** ferramentas usadas para executar testes no frontend e no
  backend, respectivamente.
- **SIGILL / `Illegal instruction`:** encerramento de processo por uma
  instrução que o ambiente de execução não conseguiu processar; é uma falha de
  execução do ambiente e não prova, por si só, que o teste passou ou falhou na
  lógica da aplicação.

## 7. Onde encontrar cada parte

- [README do projeto](../README.md): introdução e instruções para executar.
- [Visão geral](./visao-geral.md): arquitetura e fluxo entre camadas.
- [Backend](./backend.md): módulos e regras da API.
- [Frontend](./frontend.md): telas, estado e integração com API.
- [Banco de dados](./banco-de-dados.md): schema, modelos e persistência.
- [Contrato da API](./API/contract.md): rotas, corpos e respostas.
- [Schema Prisma](../backend/prisma/schema.prisma): estrutura dos modelos.
- [Seed](../backend/prisma/seed.ts): currículo e dados iniciais.
- [Configuração Prisma](../backend/prisma.config.ts): caminho do schema,
  migrations, seed e leitura da URL de conexão.
- [Exemplo de ambiente](../.env.example): nomes de variáveis sem segredos.

## 8. Referências de estado

- Branch observada no registro deste documento: `main`.
- Última data considerada: **20/11/2026**.
- As fases 0 a 3 estão registradas como executadas no histórico e no estado
  atual do projeto.
- A fase 4 de validação integrada é o próximo checklist pendente.
- A última tentativa de Vitest em sessões anteriores terminou com SIGILL;
  confira novamente os testes no ambiente atual antes de considerar a
  validação final concluída.
- O documento não armazena valores de `.env`, credenciais do Neon, senhas,
  tokens ou dados pessoais.