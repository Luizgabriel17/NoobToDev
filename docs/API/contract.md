# Contrato da API do NoobToDev

Base URL em desenvolvimento: `http://localhost:3000`
Formato: JSON. Todas as rotas, exceto `POST /auth/register` e `POST /auth/login`, exigem o cabeçalho `Authorization: Bearer <accessToken>`.
Erros seguem o padrão do NestJS: `{ "statusCode": 400, "message": "texto" | ["texto", ...], "error": "Bad Request" }`. As mensagens são em português.

## Fluxo de trabalho Git para agentes

- Trabalhe diretamente na branch `main` do repositório principal; não crie nem use branches de funcionalidade.
- Inclua todas as alterações solicitadas em commits feitos na `main`, inclusive mudanças na API, no front-end e na documentação.
- Antes de encerrar a tarefa, confirme que as alterações estão commitadas na `main` e que não há branches de funcionalidade sobrando. Preserve sempre a branch `main`.

## Regras de negócio (valem para back-end e front-end)

1. **Estado das lições** (calculado no servidor): dentro de cada trilha, as lições seguem a ordem (`ordem` do módulo, depois `ordem` da lição). A primeira lição é `DISPONIVEL`. Cada lição seguinte só fica `DISPONIVEL` quando a anterior estiver `CONCLUIDA`. Antes disso é `BLOQUEADA`. Lições com `publicada = false` não aparecem para estudantes.
2. **Conclusão de lição:** a lição passa a `CONCLUIDA` automaticamente quando o estudante enviar pelo menos uma resposta para cada desafio dela. Errar não impede a conclusão: o sistema mostra a resposta certa e segue.
3. **XP:** cada desafio vale `pontos`. O XP só é concedido na primeira resposta correta de cada desafio por usuário. Repetir a lição não gera XP de novo. O XP vai para `ProgressoLicao.xpGanho` e `Usuario.xpTotal` na mesma transação que grava a `Tentativa`.
4. **Correção no servidor:** o cliente nunca recebe `correta`, `posicaoCorreta` nem `explicacao` antes de responder.
5. **Tipos de desafio:**
   - `ESCOLHA_UNICA`: a resposta é `{ "opcaoId": number }`. Está correta se a opção tiver `correta = true`.
   - `ORDENACAO`: a resposta é `{ "ordem": number[] }`, com os ids de todas as opções do desafio, uma vez cada, na ordem escolhida. Está correta se a ordem for igual à ordenação por `posicaoCorreta` crescente. As opções chegam embaralhadas ao cliente.
   - `ESCRITA_CODIGO`: a resposta é `{ "codigo": string }`, limitada a 12.000 caracteres. O servidor verifica os critérios configurados para o exercício (elementos/atributos HTML ou declarações CSS) sem executar o código. As verificações não são enviadas ao aluno; respostas incorretas podem ser reenviadas e não concluem a lição.

   Para exercícios de código, `Desafio.conteudo` armazena `linguagem`, `orientacao`, `codigoInicial` e `verificacoes`. O endpoint de lições envia ao estudante somente os três primeiros campos; as verificações ficam privadas no servidor. Critérios HTML aceitos: `HTML_ELEMENT` (`tag`, `texto`), `HTML_ATTRIBUTE` (`tag`, `atributo`, `valor`), `CSS_DECLARATION` (`seletor`, `propriedade`, `valor`) e `CSS_MEDIA_QUERY` (`condicao`).
6. **Lição reaberta:** uma lição `CONCLUIDA` pode ser refeita para revisão, mas continua `CONCLUIDA` e não gera XP novamente.

## Rotas

### Autenticação (já implementadas na fase 2)

| Método e rota         | Corpo                    | Sucesso                        | Erros    |
| --------------------- | ------------------------ | ------------------------------ | -------- |
| `POST /auth/register` | `{ nome, email, senha }` | 201 `Usuario`                  | 400, 409 |
| `POST /auth/login`    | `{ email, senha }`       | 200 `{ accessToken, usuario }` | 400, 401 |
| `GET /auth/me`        |                          | 200 `Usuario`                  | 401      |

`Usuario` = `{ id, nome, email, xpTotal, papel }`.

### `GET /trilhas`

Lista as trilhas das linguagens ativas, com módulos, lições publicadas e o estado de cada lição para o usuário logado.

```json
[
  {
    "id": 1,
    "titulo": "Fundamentos de Desenvolvimento Web",
    "linguagem": { "id": 1, "nome": "HTML e CSS", "slug": "html-css" },
    "progresso": { "concluidas": 1, "total": 5, "percentual": 20 },
    "modulos": [
      {
        "id": 1,
        "titulo": "Introdução ao HTML",
        "ordem": 1,
        "licoes": [
          {
            "id": 1,
            "titulo": "Estrutura básica",
            "ordem": 1,
            "status": "CONCLUIDA",
            "xpGanho": 30
          },
          {
            "id": 2,
            "titulo": "Textos: h1 e p",
            "ordem": 2,
            "status": "DISPONIVEL",
            "xpGanho": 0
          }
        ]
      }
    ]
  }
]
```

### `GET /licoes/:id`

Devolve a lição com os desafios, sem gabarito.

```json
{
  "id": 2,
  "titulo": "Textos: h1 e p",
  "moduloTitulo": "Introdução ao HTML",
  "status": "DISPONIVEL",
  "desafios": [
    {
      "id": 10,
      "ordem": 1,
      "tipo": "ESCOLHA_UNICA",
      "enunciado": "Qual tag cria o título principal de uma página?",
      "pontos": 10,
      "conteudo": null,
      "respondido": false,
      "opcoes": [
        { "id": 100, "texto": "<h1>" },
        { "id": 101, "texto": "<p>" }
      ]
    }
  ]
}
```

Erros: 404 (não existe ou não publicada), 403 (lição `BLOQUEADA`).

### `POST /desafios/:id/respostas`

Corpo: `{ "opcaoId": 100 }` (escolha única), `{ "ordem": [5, 3, 4] }` (ordenação) ou `{ "codigo": "<h1>Olá</h1>" }` (escrita de código).

```json
{
  "acertou": true,
  "xpGanho": 10,
  "explicacao": "A tag h1 define o título principal da página.",
  "respostaCorreta": { "opcaoId": 100 },
  "xpTotal": 40,
  "licao": null
}
```

- `respostaCorreta` tem o mesmo formato da resposta do tipo (`{ opcaoId }` ou `{ ordem }`); em escrita de código é `null` para não revelar a solução.
- `xpGanho` é 0 quando errou ou quando o desafio já tinha sido acertado antes.
- Exercícios de código podem ser reenviados. Uma resposta incorreta não conclui esse desafio nem a lição; o XP continua sendo concedido apenas na primeira resposta correta.
- `licao` é `null` enquanto houver desafios sem resposta. Na resposta ao último desafio, vem `{ "concluida": true, "acertos": 3, "total": 4, "xpGanho": 30, "proximaLicaoId": 3 }`, com `proximaLicaoId` igual a `null` se for a última da trilha.

Erros: 400 (formato inválido para o tipo, opção que não pertence ao desafio, ordem incompleta), 403 (lição bloqueada), 404.

### `GET /perfil`

```json
{
  "id": 1,
  "nome": "Ana",
  "email": "ana@teste.com",
  "xpTotal": 40,
  "licoesConcluidas": 1,
  "totalLicoes": 5,
  "criadoEm": "2026-11-15T12:00:00.000Z",
  "trilhas": [
    {
      "id": 1,
      "titulo": "Fundamentos de Desenvolvimento Web",
      "concluidas": 1,
      "total": 5,
      "percentual": 20
    }
  ]
}
```

### Administração (opcional, apenas `papel = ADMIN`; 403 para os demais)

CRUD de conteúdo em `/admin/linguagens`, `/admin/trilhas`, `/admin/modulos`, `/admin/licoes` e `/admin/desafios`, cada um com `GET /`, `GET /:id`, `POST /`, `PATCH /:id` e `DELETE /:id`. Um desafio é criado e editado junto com suas `opcoes`. Excluir algo que já tem progresso ou tentativas devolve 409.
