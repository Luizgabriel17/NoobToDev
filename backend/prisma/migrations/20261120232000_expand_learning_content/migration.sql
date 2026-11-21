ALTER TYPE "TipoDesafio" ADD VALUE 'COMPLETAR_LACUNAS';
ALTER TYPE "TipoDesafio" ADD VALUE 'ENCONTRAR_ERRO';

CREATE TYPE "TipoLicao" AS ENUM ('CONTEUDO', 'PROJETO', 'REVISAO');

ALTER TABLE "licoes"
ADD COLUMN "tipo" "TipoLicao" NOT NULL DEFAULT 'CONTEUDO',
ADD COLUMN "explicacao" TEXT,
ADD COLUMN "exemplo_codigo" TEXT,
ADD COLUMN "exemplo_resultado" TEXT;

ALTER TABLE "desafios"
ADD COLUMN "dica" TEXT,
ADD COLUMN "revisao_de_id" INTEGER;

CREATE INDEX "desafios_revisao_de_id_idx" ON "desafios"("revisao_de_id");

ALTER TABLE "desafios"
ADD CONSTRAINT "desafios_revisao_de_id_fkey"
FOREIGN KEY ("revisao_de_id") REFERENCES "desafios"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
