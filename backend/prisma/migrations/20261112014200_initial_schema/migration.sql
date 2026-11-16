-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ESTUDANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoDesafio" AS ENUM ('ESCOLHA_UNICA', 'ORDENACAO');

-- CreateEnum
CREATE TYPE "StatusLicao" AS ENUM ('DISPONIVEL', 'BLOQUEADA', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ESTUDANTE',
    "xp_total" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linguagens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "linguagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trilhas" (
    "id" SERIAL NOT NULL,
    "linguagem_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "trilhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" SERIAL NOT NULL,
    "trilha_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licoes" (
    "id" SERIAL NOT NULL,
    "modulo_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "licoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desafios" (
    "id" SERIAL NOT NULL,
    "licao_id" INTEGER NOT NULL,
    "tipo" "TipoDesafio" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "explicacao" TEXT,
    "conteudo" JSONB,
    "pontos" INTEGER NOT NULL DEFAULT 10,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "desafios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes" (
    "id" SERIAL NOT NULL,
    "desafio_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "posicao_correta" INTEGER,

    CONSTRAINT "opcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresso_licao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "licao_id" INTEGER NOT NULL,
    "status" "StatusLicao" NOT NULL DEFAULT 'DISPONIVEL',
    "xp_ganho" INTEGER NOT NULL DEFAULT 0,
    "concluida_em" TIMESTAMP(3),

    CONSTRAINT "progresso_licao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "desafio_id" INTEGER NOT NULL,
    "resposta" JSONB NOT NULL,
    "acertou" BOOLEAN NOT NULL,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade_diaria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "dia" DATE NOT NULL,
    "xp_dia" INTEGER NOT NULL DEFAULT 0,
    "licoes_concluidas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "atividade_diaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquistas" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "xp_bonus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_conquista" (
    "usuario_id" INTEGER NOT NULL,
    "conquista_id" INTEGER NOT NULL,
    "conquistada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_conquista_pkey" PRIMARY KEY ("usuario_id","conquista_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "linguagens_slug_key" ON "linguagens"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "trilhas_linguagem_id_ordem_key" ON "trilhas"("linguagem_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "modulos_trilha_id_ordem_key" ON "modulos"("trilha_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "licoes_modulo_id_ordem_key" ON "licoes"("modulo_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "desafios_licao_id_ordem_key" ON "desafios"("licao_id", "ordem");

-- CreateIndex
CREATE INDEX "opcoes_desafio_id_idx" ON "opcoes"("desafio_id");

-- CreateIndex
CREATE INDEX "progresso_licao_licao_id_idx" ON "progresso_licao"("licao_id");

-- CreateIndex
CREATE UNIQUE INDEX "progresso_licao_usuario_id_licao_id_key" ON "progresso_licao"("usuario_id", "licao_id");

-- CreateIndex
CREATE INDEX "tentativas_usuario_id_desafio_id_idx" ON "tentativas"("usuario_id", "desafio_id");

-- CreateIndex
CREATE INDEX "tentativas_desafio_id_idx" ON "tentativas"("desafio_id");

-- CreateIndex
CREATE UNIQUE INDEX "atividade_diaria_usuario_id_dia_key" ON "atividade_diaria"("usuario_id", "dia");

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_codigo_key" ON "conquistas"("codigo");

-- AddForeignKey
ALTER TABLE "trilhas" ADD CONSTRAINT "trilhas_linguagem_id_fkey" FOREIGN KEY ("linguagem_id") REFERENCES "linguagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licoes" ADD CONSTRAINT "licoes_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios" ADD CONSTRAINT "desafios_licao_id_fkey" FOREIGN KEY ("licao_id") REFERENCES "licoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes" ADD CONSTRAINT "opcoes_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_licao" ADD CONSTRAINT "progresso_licao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_licao" ADD CONSTRAINT "progresso_licao_licao_id_fkey" FOREIGN KEY ("licao_id") REFERENCES "licoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas" ADD CONSTRAINT "tentativas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas" ADD CONSTRAINT "tentativas_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_diaria" ADD CONSTRAINT "atividade_diaria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_conquista" ADD CONSTRAINT "usuario_conquista_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_conquista" ADD CONSTRAINT "usuario_conquista_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
