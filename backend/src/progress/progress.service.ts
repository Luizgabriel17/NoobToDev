import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { StatusLicao, TipoDesafio } from '@prisma/client';
import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';
import { PrismaService } from '../prisma/prisma.service';

export interface LessonProgressState {
  id: number;
  ordem: number;
  moduloOrdem: number;
  progressos: Array<{ status: StatusLicao; xpGanho?: number }>;
}

export interface LessonWithState<T extends LessonProgressState> {
  lesson: T;
  status: StatusLicao;
}

export type ChallengeAnswer =
  | { opcaoId: number }
  | { ordem: number[] }
  | { codigo: string }
  | { respostaTexto: string };

export type StandardChallengeAnswer = { opcaoId: number } | { ordem: number[] };

type CodeCheck =
  | { tipo: 'HTML_ELEMENT'; tag: string; texto: string }
  | {
      tipo: 'HTML_ATTRIBUTE';
      tag: string;
      atributo: string;
      valor: string;
    }
  | {
      tipo: 'CSS_DECLARATION';
      seletor: string;
      propriedade: string;
      valor: string;
    }
  | { tipo: 'CSS_MEDIA_QUERY'; condicao: string };

interface CodeChallengeContent {
  linguagem: 'html' | 'css';
  verificacoes: CodeCheck[];
}

export interface ChallengeOption {
  id: number;
  correta: boolean;
  posicaoCorreta: number | null;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  calculateLessonStates<T extends LessonProgressState>(
    lessons: readonly T[],
  ): Array<LessonWithState<T>> {
    let previousCompleted = true;

    return lessons.map((lesson) => {
      const completed = lesson.progressos[0]?.status === StatusLicao.CONCLUIDA;
      const status = completed
        ? StatusLicao.CONCLUIDA
        : previousCompleted
          ? StatusLicao.DISPONIVEL
          : StatusLicao.BLOQUEADA;

      previousCompleted = status === StatusLicao.CONCLUIDA;
      return { lesson, status };
    });
  }

  async getLessonStates(usuarioId: number, trilhaId: number) {
    const lessons = await this.prisma.licao.findMany({
      where: {
        publicada: true,
        modulo: { trilhaId },
      },
      select: {
        id: true,
        ordem: true,
        modulo: { select: { ordem: true } },
        progressos: {
          where: { usuarioId },
          select: { status: true, xpGanho: true },
        },
      },
      orderBy: [{ modulo: { ordem: 'asc' } }, { ordem: 'asc' }],
    });

    return this.calculateLessonStates(
      lessons.map((lesson) => ({
        id: lesson.id,
        ordem: lesson.ordem,
        moduloOrdem: lesson.modulo.ordem,
        progressos: lesson.progressos,
      })),
    );
  }

  async requireAvailableLesson(
    usuarioId: number,
    trilhaId: number,
    licaoId: number,
  ) {
    const states = await this.getLessonStates(usuarioId, trilhaId);
    const state = states.find(({ lesson }) => lesson.id === licaoId);

    if (!state || state.status === StatusLicao.BLOQUEADA) {
      throw new ForbiddenException('Esta lição ainda está bloqueada.');
    }

    return {
      status: state.status,
      nextLessonId:
        states[states.findIndex(({ lesson }) => lesson.id === licaoId) + 1]
          ?.lesson.id ?? null,
    };
  }

  evaluateAnswer(
    tipo: TipoDesafio,
    resposta: StandardChallengeAnswer,
    opcoes: readonly ChallengeOption[],
  ): { acertou: boolean; respostaCorreta: StandardChallengeAnswer } {
    if (
      tipo === TipoDesafio.ESCOLHA_UNICA ||
      tipo === TipoDesafio.ENCONTRAR_ERRO
    ) {
      if (!('opcaoId' in resposta)) {
        throw new BadRequestException(
          'A resposta de escolha única deve conter opcaoId.',
        );
      }

      const selecionada = opcoes.find(({ id }) => id === resposta.opcaoId);
      if (!selecionada) {
        throw new BadRequestException(
          'A opção informada não pertence a este desafio.',
        );
      }

      const correta = opcoes.find(({ correta: isCorrect }) => isCorrect);
      if (!correta) {
        throw new BadRequestException(
          'O desafio não possui uma opção correta configurada.',
        );
      }

      return {
        acertou: selecionada.correta,
        respostaCorreta: { opcaoId: correta.id },
      };
    }

    if (!('ordem' in resposta)) {
      throw new BadRequestException(
        'A resposta de ordenação deve conter ordem.',
      );
    }

    const ids = opcoes.map(({ id }) => id);
    if (
      resposta.ordem.length !== ids.length ||
      new Set(resposta.ordem).size !== ids.length ||
      resposta.ordem.some((id) => !ids.includes(id))
    ) {
      throw new BadRequestException(
        'A ordem deve conter uma vez cada opção deste desafio.',
      );
    }

    const ordenadas = [...opcoes].sort(
      (a, b) =>
        (a.posicaoCorreta ?? Number.MAX_SAFE_INTEGER) -
        (b.posicaoCorreta ?? Number.MAX_SAFE_INTEGER),
    );
    if (
      ordenadas.some((opcao) => opcao.posicaoCorreta === null) ||
      new Set(ordenadas.map(({ posicaoCorreta }) => posicaoCorreta)).size !==
        ordenadas.length
    ) {
      throw new BadRequestException(
        'O desafio não possui uma ordem correta configurada.',
      );
    }

    const ordemCorreta = ordenadas.map(({ id }) => id);
    return {
      acertou: resposta.ordem.every((id, index) => id === ordemCorreta[index]),
      respostaCorreta: { ordem: ordemCorreta },
    };
  }

  evaluateCodeAnswer(
    codigo: string,
    conteudo: unknown,
  ): { acertou: boolean; respostaCorreta: null } {
    const config = this.parseCodeChallengeContent(conteudo);
    const codigoSemComentarios =
      config.linguagem === 'css'
        ? codigo.replace(/\/\*[\s\S]*?\*\//g, '')
        : codigo;
    const acertou = config.verificacoes.every((verificacao) =>
      this.checkCodeRequirement(
        codigoSemComentarios,
        verificacao,
        config.linguagem,
      ),
    );

    return { acertou, respostaCorreta: null };
  }

  evaluateBlankAnswer(
    respostaTexto: string,
    conteudo: unknown,
  ): { acertou: boolean; respostaCorreta: null } {
    if (
      !this.isRecord(conteudo) ||
      typeof conteudo['orientacao'] !== 'string' ||
      typeof conteudo['codigoInicial'] !== 'string' ||
      !Array.isArray(conteudo['respostasAceitas']) ||
      conteudo['respostasAceitas'].length === 0 ||
      !conteudo['respostasAceitas'].every(
        (answer: unknown) => typeof answer === 'string' && answer.trim(),
      )
    ) {
      throw new BadRequestException(
        'O desafio de completar lacunas não possui respostas válidas.',
      );
    }

    const respostaNormalizada = this.normalizarTexto(respostaTexto);
    return {
      acertou: conteudo['respostasAceitas'].some(
        (answer: string) =>
          this.normalizarTexto(answer) === respostaNormalizada,
      ),
      respostaCorreta: null,
    };
  }

  private parseCodeChallengeContent(conteudo: unknown): CodeChallengeContent {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null;
    const isString = (value: unknown): value is string =>
      typeof value === 'string';
    const isValidCheck = (value: unknown): value is CodeCheck => {
      if (!isRecord(value) || !isString(value['tipo'])) {
        return false;
      }

      if (value['tipo'] === 'HTML_ELEMENT') {
        return isString(value['tag']) && isString(value['texto']);
      }
      if (value['tipo'] === 'HTML_ATTRIBUTE') {
        return (
          isString(value['tag']) &&
          isString(value['atributo']) &&
          isString(value['valor'])
        );
      }
      if (value['tipo'] === 'CSS_DECLARATION') {
        return (
          isString(value['seletor']) &&
          isString(value['propriedade']) &&
          isString(value['valor'])
        );
      }
      if (value['tipo'] === 'CSS_MEDIA_QUERY') {
        return isString(value['condicao']);
      }
      return false;
    };

    if (
      !isRecord(conteudo) ||
      (conteudo['linguagem'] !== 'html' && conteudo['linguagem'] !== 'css') ||
      !Array.isArray(conteudo['verificacoes']) ||
      conteudo['verificacoes'].length === 0 ||
      !conteudo['verificacoes'].every(isValidCheck) ||
      (conteudo['linguagem'] === 'html' &&
        conteudo['verificacoes'].some(
          (check) =>
            check['tipo'] === 'CSS_DECLARATION' ||
            check['tipo'] === 'CSS_MEDIA_QUERY',
        )) ||
      (conteudo['linguagem'] === 'css' &&
        conteudo['verificacoes'].some(
          (check) =>
            check['tipo'] !== 'CSS_DECLARATION' &&
            check['tipo'] !== 'CSS_MEDIA_QUERY',
        ))
    ) {
      throw new BadRequestException(
        'O desafio de código não possui verificações válidas.',
      );
    }

    return {
      linguagem: conteudo['linguagem'],
      verificacoes: conteudo['verificacoes'],
    };
  }

  private checkCodeRequirement(
    codigo: string,
    verificacao: CodeCheck,
    linguagem: CodeChallengeContent['linguagem'],
  ): boolean {
    if (verificacao.tipo === 'CSS_MEDIA_QUERY') {
      return this.normalizarCss(codigo).includes(
        this.normalizarCss(`@media ${verificacao.condicao}`),
      );
    }

    if (verificacao.tipo === 'HTML_ELEMENT') {
      if (!/^[a-z][a-z0-9-]*$/i.test(verificacao.tag)) {
        return false;
      }
      return this.htmlElements(codigo).some(
        (element) =>
          element.tagName === verificacao.tag.toLowerCase() &&
          this.normalizarTexto(this.htmlText(element.childNodes)).includes(
            this.normalizarTexto(verificacao.texto),
          ),
      );
    }

    if (verificacao.tipo === 'HTML_ATTRIBUTE') {
      if (
        !/^[a-z][a-z0-9-]*$/i.test(verificacao.tag) ||
        !/^[a-z_:][a-z0-9:_.-]*$/i.test(verificacao.atributo)
      ) {
        return false;
      }

      return this.htmlElements(codigo).some(
        (element) =>
          element.tagName === verificacao.tag.toLowerCase() &&
          element.attrs.some(
            (attribute) =>
              attribute.name === verificacao.atributo.toLowerCase() &&
              attribute.value === verificacao.valor,
          ),
      );
    }

    if (linguagem !== 'css') {
      return false;
    }

    const selectorEsperado = this.normalizarCss(verificacao.seletor);
    const propriedadeEsperada = verificacao.propriedade.toLowerCase();
    const valorEsperado = this.normalizarCss(verificacao.valor);
    const regras = codigo.matchAll(/([^{}]+)\{([^{}]*)\}/g);

    for (const regra of regras) {
      const seletores = regra[1]
        .split(',')
        .map((seletor) => this.normalizarCss(seletor));
      if (!seletores.includes(selectorEsperado)) {
        continue;
      }

      const declaracoes = regra[2].split(';');
      for (const declaracao of declaracoes) {
        const separador = declaracao.indexOf(':');
        if (separador < 0) {
          continue;
        }

        const propriedade = declaracao.slice(0, separador).trim().toLowerCase();
        const valor = this.normalizarCss(declaracao.slice(separador + 1));
        if (propriedade === propriedadeEsperada && valor === valorEsperado) {
          return true;
        }
      }
    }

    return false;
  }

  private htmlElements(codigo: string): DefaultTreeAdapterTypes.Element[] {
    const visit = (
      nodes: readonly DefaultTreeAdapterTypes.ChildNode[],
    ): DefaultTreeAdapterTypes.Element[] =>
      nodes.flatMap((node) => {
        if (!('tagName' in node)) {
          return [];
        }
        return [node, ...visit(node.childNodes)];
      });

    return visit(parseFragment(codigo).childNodes);
  }

  private htmlText(
    nodes: readonly DefaultTreeAdapterTypes.ChildNode[],
  ): string {
    return nodes
      .map((node) =>
        'value' in node
          ? node.value
          : 'childNodes' in node
            ? this.htmlText(node.childNodes)
            : '',
      )
      .join('');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private normalizarTexto(value: string): string {
    return value
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase();
  }

  private normalizarCss(valor: string): string {
    return valor
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s*([():,])\s*/g, '$1')
      .toLowerCase();
  }

  shouldGrantXp(acertou: boolean, acertouAntes: boolean): boolean {
    return acertou && !acertouAntes;
  }

  isLessonCompleted(
    challengeIds: readonly number[],
    answeredChallengeIds: readonly number[],
  ): boolean {
    const answered = new Set(answeredChallengeIds);
    return (
      challengeIds.length > 0 &&
      challengeIds.every((challengeId) => answered.has(challengeId))
    );
  }

  embaralhar<T>(items: readonly T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[otherIndex]] = [
        shuffled[otherIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  exigirDisponibilidade(status: StatusLicao): void {
    if (status === StatusLicao.BLOQUEADA) {
      throw new ForbiddenException('Esta lição ainda está bloqueada.');
    }
  }
}
