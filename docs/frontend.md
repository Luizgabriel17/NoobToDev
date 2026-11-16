# Frontend

## Visão da aplicação

O frontend é uma aplicação Angular com TypeScript, componentes standalone e rotas carregadas sob demanda. A aplicação inicia em [`frontend/src/main.ts`](../frontend/src/main.ts), usa a configuração de provedores em [`frontend/src/app/app.config.ts`](../frontend/src/app/app.config.ts) e define suas páginas em [`frontend/src/app/app.routes.ts`](../frontend/src/app/app.routes.ts).

As páginas e funcionalidades ficam em `frontend/src/app/features/`; chamadas HTTP e estado compartilhado ficam em `services/`; interfaces de dados ficam em `models/`; configurações e comportamentos transversais ficam em `core/`. O HTML e o CSS de cada componente são mantidos junto ao seu TypeScript.

## Páginas e navegação

| Caminho | Página | Acesso |
| --- | --- | --- |
| `/login` | Entrada na conta | Público. |
| `/register` | Cadastro | Público. |
| `/trilha` | Trilhas, módulos, lições e progresso | Protegido pelo `authGuard`. |
| `/licao/:id` | Desafios de uma lição | Protegido pelo `authGuard`. |
| `/perfil` | Resumo da conta e do progresso | Protegido pelo `authGuard`. |
| Qualquer outro caminho | Página não encontrada | Público. |

As rotas das páginas principais usam `loadComponent`, reduzindo o carregamento inicial. Não há página administrativa no conjunto atual de rotas, embora a API disponibilize endpoints de administração.

## Integração com a API

[`frontend/src/app/core/api.config.ts`](../frontend/src/app/core/api.config.ts) define `/api` como base. O arquivo [`frontend/proxy.conf.json`](../frontend/proxy.conf.json) encaminha chamadas `/api/**` para `http://localhost:3000` e remove o prefixo `/api`. Assim, por exemplo, `GET /api/trilhas` chega ao backend como `GET /trilhas`.

Os serviços encapsulam as chamadas e o estado de carregamento:

- `AuthService`: cadastro, login, sessão, usuário e saída;
- `TrilhasService`: lista de trilhas;
- `LicoesService`: detalhes da lição e envio de resposta;
- `PerfilService`: perfil do usuário.

Os modelos em `models/` documentam os dados esperados pela interface. Ao mudar um DTO da API, confira e atualize o modelo e o serviço Angular correspondente.

## Autenticação no navegador

O `AuthService` mantém usuário, token, carregamento e mensagem de erro em Angular signals. Após o login, o token e os dados públicos do usuário são guardados no `localStorage` sob as chaves declaradas em `STORAGE_KEYS`. Na inicialização, os dados do usuário são analisados e validados antes de serem reutilizados; dados inválidos são removidos.

O `authGuard` deixa navegar para as páginas protegidas quando há token e usuário em memória; caso contrário, direciona para `/login`. O `authInterceptor` adiciona o token como `Bearer` às requisições da API e encerra a sessão se receber `401`. A autenticação real continua sendo responsabilidade do backend: a proteção de rota no navegador melhora a navegação, mas não substitui os guards da API.

O cadastro chama a rota de registro e, se tiver sucesso, faz login com as credenciais recém-informadas para iniciar a sessão.

## Formulários e validações

Os formulários de entrada e cadastro usam Reactive Forms, `FormBuilder` e validadores síncronos do Angular. Os templates usam `novalidate`; a validade é controlada pelo formulário Angular e o botão fica desativado enquanto o formulário estiver inválido ou a operação estiver carregando. Ao submeter um formulário inválido, o componente marca os campos como tocados.

Regras atuais do formulário:

| Tela | Campo | Regra no Angular |
| --- | --- | --- |
| Cadastro | Nome | Obrigatório e pelo menos 2 caracteres. |
| Cadastro | E-mail | Obrigatório e formato de e-mail. |
| Cadastro | Senha | Obrigatória, entre 6 e 12 caracteres. |
| Login | E-mail | Obrigatório e formato de e-mail. |
| Login | Senha | Obrigatória. |

Essas regras de interface não substituem a validação do servidor. Os DTOs NestJS validam novamente os dados; o backend também verifica se o e-mail já existe, se as credenciais estão corretas e se a operação é autorizada. Para adicionar um campo ou alterar uma regra, alinhe componente, modelo/payload, DTO do backend e mensagens apresentadas.

## Desafios e regras no cliente

`LicaoPageComponent` identifica o desafio atual e usa signals e propriedades `computed` para controlar a resposta e a habilitação do botão de verificação:

- escolha única requer um ID de opção;
- ordenação requer uma sequência com o número esperado de opções;
- escrita de código requer texto não vazio.

Para ordenação, a interface usa Angular CDK Drag and Drop, além de controles para mover os itens. Para escrita de código, a tela recebe a linguagem, a orientação e o código inicial na propriedade `conteudo` do desafio. A resposta é enviada à API, que faz a avaliação definitiva e registra a tentativa. Portanto, as verificações visuais no Angular são uma conveniência de uso, não uma regra de segurança ou avaliação confiável.

Após receber o resultado, a página mostra feedback, atualiza o XP local e avança para o próximo desafio, para a próxima lição ou para a trilha. A API permanece como fonte oficial de progresso e XP.

## Erros, carregamento e estilo

Os serviços publicam sinais para `loading`, `submitting` e `error`, adequados para estados de carregamento e mensagens na página. [`frontend/src/app/core/error.util.ts`](../frontend/src/app/core/error.util.ts) transforma erros HTTP conhecidos em mensagens legíveis, incluindo falha de conexão, sessão expirada, falta de permissão e conteúdo inexistente. O erro original não deve ser tratado como sucesso: se uma nova operação precisa de tratamento, mantenha o estado de erro visível e preserve o fluxo de falha.

Os estilos globais estão em `frontend/src/styles.css`, que importa Bootstrap e define cores e estilos compartilhados. Cada componente pode complementar esses estilos no seu próprio arquivo CSS. O pacote inclui Tailwind, mas o estilo global atual importa Bootstrap; antes de introduzir padrões de estilo novos, confira os componentes existentes.

## Desenvolvimento e verificação

Na pasta `frontend`, os comandos configurados são:

```bash
npm start
npm run build
npm test
```

`npm start` executa o servidor Angular de desenvolvimento com o proxy. A compilação de produção é a configuração padrão de `npm run build`; os testes usam Vitest por meio do builder Angular. Para alterar a interface, execute ao menos a compilação e os testes relevantes existentes.
