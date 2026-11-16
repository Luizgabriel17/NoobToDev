import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoDesafio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDesafioDto,
  CreateLicaoDto,
  CreateLinguagemDto,
  CreateModuloDto,
  CreateOpcaoDto,
  CreateTrilhaDto,
  UpdateDesafioDto,
  UpdateLicaoDto,
  UpdateLinguagemDto,
  UpdateModuloDto,
  UpdateTrilhaDto,
} from './dto/admin.dto';

type Operation = 'create' | 'update' | 'delete';
type AdminOption = Pick<CreateOpcaoDto, 'texto'> & {
  correta?: boolean;
  posicaoCorreta?: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listarLinguagens() {
    return this.prisma.linguagem.findMany({ orderBy: { id: 'asc' } });
  }

  async buscarLinguagem(id: number) {
    return this.findOrNotFound(
      this.prisma.linguagem.findUnique({ where: { id } }),
      'Linguagem',
    );
  }

  async criarLinguagem(dto: CreateLinguagemDto) {
    return this.run(() =>
      this.prisma.linguagem.create({
        data: {
          nome: dto.nome.trim(),
          slug: dto.slug.trim(),
          ativa: dto.ativa ?? true,
        },
      }),
    );
  }

  async atualizarLinguagem(id: number, dto: UpdateLinguagemDto) {
    return this.run(
      () =>
        this.prisma.linguagem.update({
          where: { id },
          data: {
            ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
            ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
            ...(dto.ativa !== undefined ? { ativa: dto.ativa } : {}),
          },
        }),
      'update',
      'Linguagem',
    );
  }

  async excluirLinguagem(id: number) {
    await this.checkHistory(
      { licao: { modulo: { trilha: { linguagemId: id } } } },
      { desafio: { licao: { modulo: { trilha: { linguagemId: id } } } } },
    );
    return this.run(
      () => this.prisma.linguagem.delete({ where: { id } }),
      'delete',
      'Linguagem',
    );
  }

  listarTrilhas() {
    return this.prisma.trilha.findMany({
      include: { linguagem: true },
      orderBy: [{ linguagemId: 'asc' }, { ordem: 'asc' }],
    });
  }

  async buscarTrilha(id: number) {
    return this.findOrNotFound(
      this.prisma.trilha.findUnique({
        where: { id },
        include: { linguagem: true },
      }),
      'Trilha',
    );
  }

  async criarTrilha(dto: CreateTrilhaDto) {
    return this.run(() =>
      this.prisma.trilha.create({
        data: {
          linguagemId: dto.linguagemId,
          titulo: dto.titulo.trim(),
          ordem: dto.ordem,
        },
      }),
    );
  }

  async atualizarTrilha(id: number, dto: UpdateTrilhaDto) {
    return this.run(
      () =>
        this.prisma.trilha.update({
          where: { id },
          data: {
            ...(dto.linguagemId !== undefined
              ? { linguagemId: dto.linguagemId }
              : {}),
            ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
            ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
          },
        }),
      'update',
      'Trilha',
    );
  }

  async excluirTrilha(id: number) {
    await this.checkHistory(
      { licao: { modulo: { trilhaId: id } } },
      { desafio: { licao: { modulo: { trilhaId: id } } } },
    );
    return this.run(
      () => this.prisma.trilha.delete({ where: { id } }),
      'delete',
      'Trilha',
    );
  }

  listarModulos() {
    return this.prisma.modulo.findMany({
      include: { trilha: true },
      orderBy: [{ trilhaId: 'asc' }, { ordem: 'asc' }],
    });
  }

  async buscarModulo(id: number) {
    return this.findOrNotFound(
      this.prisma.modulo.findUnique({
        where: { id },
        include: { trilha: true },
      }),
      'Módulo',
    );
  }

  async criarModulo(dto: CreateModuloDto) {
    return this.run(() =>
      this.prisma.modulo.create({
        data: {
          trilhaId: dto.trilhaId,
          titulo: dto.titulo.trim(),
          ordem: dto.ordem,
        },
      }),
    );
  }

  async atualizarModulo(id: number, dto: UpdateModuloDto) {
    return this.run(
      () =>
        this.prisma.modulo.update({
          where: { id },
          data: {
            ...(dto.trilhaId !== undefined ? { trilhaId: dto.trilhaId } : {}),
            ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
            ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
          },
        }),
      'update',
      'Módulo',
    );
  }

  async excluirModulo(id: number) {
    await this.checkHistory(
      { licao: { moduloId: id } },
      { desafio: { licao: { moduloId: id } } },
    );
    return this.run(
      () => this.prisma.modulo.delete({ where: { id } }),
      'delete',
      'Módulo',
    );
  }

  listarLicoes() {
    return this.prisma.licao.findMany({
      include: { modulo: true },
      orderBy: [{ moduloId: 'asc' }, { ordem: 'asc' }],
    });
  }

  async buscarLicao(id: number) {
    return this.findOrNotFound(
      this.prisma.licao.findUnique({
        where: { id },
        include: { modulo: true },
      }),
      'Lição',
    );
  }

  async criarLicao(dto: CreateLicaoDto) {
    return this.run(() =>
      this.prisma.licao.create({
        data: {
          moduloId: dto.moduloId,
          titulo: dto.titulo.trim(),
          ordem: dto.ordem,
          publicada: dto.publicada ?? false,
        },
      }),
    );
  }

  async atualizarLicao(id: number, dto: UpdateLicaoDto) {
    return this.run(
      () =>
        this.prisma.licao.update({
          where: { id },
          data: {
            ...(dto.moduloId !== undefined ? { moduloId: dto.moduloId } : {}),
            ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
            ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
            ...(dto.publicada !== undefined
              ? { publicada: dto.publicada }
              : {}),
          },
        }),
      'update',
      'Lição',
    );
  }

  async excluirLicao(id: number) {
    await this.checkHistory({ licaoId: id }, { desafio: { licaoId: id } });
    return this.run(
      () => this.prisma.licao.delete({ where: { id } }),
      'delete',
      'Lição',
    );
  }

  listarDesafios() {
    return this.prisma.desafio.findMany({
      include: { opcoes: true, licao: true },
      orderBy: [{ licaoId: 'asc' }, { ordem: 'asc' }],
    });
  }

  async buscarDesafio(id: number) {
    return this.findOrNotFound(
      this.prisma.desafio.findUnique({
        where: { id },
        include: { opcoes: true, licao: true },
      }),
      'Desafio',
    );
  }

  async criarDesafio(dto: CreateDesafioDto) {
    this.validarOpcoes(dto.tipo, dto.opcoes ?? []);
    this.validarConteudoCodigo(dto.tipo, dto.conteudo);
    return this.run(() =>
      this.prisma.desafio.create({
        data: {
          licaoId: dto.licaoId,
          tipo: dto.tipo,
          enunciado: dto.enunciado.trim(),
          explicacao: dto.explicacao?.trim() ?? null,
          ...(dto.conteudo !== undefined ? { conteudo: dto.conteudo } : {}),
          pontos: dto.pontos,
          ordem: dto.ordem,
          opcoes: { create: this.opcoesParaCriacao(dto.opcoes ?? []) },
        },
        include: { opcoes: true },
      }),
    );
  }

  async atualizarDesafio(id: number, dto: UpdateDesafioDto) {
    const atual = await this.prisma.desafio.findUnique({
      where: { id },
      include: { opcoes: true },
    });
    if (!atual) {
      throw new NotFoundException('Desafio não encontrado.');
    }

    const tipo = dto.tipo ?? atual.tipo;
    const opcoes =
      dto.opcoes ?? (tipo === TipoDesafio.ESCRITA_CODIGO ? [] : atual.opcoes);
    const conteudo = dto.conteudo ?? atual.conteudo;
    if (dto.tipo !== undefined || dto.opcoes !== undefined) {
      this.validarOpcoes(tipo, opcoes);
    }
    if (dto.tipo !== undefined || dto.conteudo !== undefined) {
      this.validarConteudoCodigo(tipo, conteudo);
    }

    return this.run(
      () =>
        this.prisma.desafio.update({
          where: { id },
          data: {
            ...(dto.licaoId !== undefined ? { licaoId: dto.licaoId } : {}),
            ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
            ...(dto.enunciado !== undefined
              ? { enunciado: dto.enunciado.trim() }
              : {}),
            ...(dto.explicacao !== undefined
              ? { explicacao: dto.explicacao.trim() }
              : {}),
            ...(dto.conteudo !== undefined ? { conteudo: dto.conteudo } : {}),
            ...(dto.pontos !== undefined ? { pontos: dto.pontos } : {}),
            ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
            ...(dto.opcoes !== undefined ||
            (dto.tipo === TipoDesafio.ESCRITA_CODIGO &&
              atual.tipo !== TipoDesafio.ESCRITA_CODIGO)
              ? {
                  opcoes: {
                    deleteMany: {},
                    create: this.opcoesParaCriacao(dto.opcoes ?? []),
                  },
                }
              : {}),
          },
          include: { opcoes: true },
        }),
      'update',
      'Desafio',
    );
  }

  async excluirDesafio(id: number) {
    await this.checkHistory(
      { licao: { desafios: { some: { id } } } },
      { desafioId: id },
    );
    return this.run(
      () => this.prisma.desafio.delete({ where: { id } }),
      'delete',
      'Desafio',
    );
  }

  private validarOpcoes(
    tipo: TipoDesafio,
    opcoes: readonly AdminOption[],
  ): void {
    if (tipo === TipoDesafio.ESCRITA_CODIGO) {
      if (opcoes.length > 0) {
        throw new BadRequestException(
          'Desafios de código não devem conter opções de múltipla escolha.',
        );
      }
      return;
    }

    if (opcoes.length < 2) {
      throw new BadRequestException(
        'O desafio deve conter pelo menos duas opções.',
      );
    }

    if (tipo === TipoDesafio.ESCOLHA_UNICA) {
      if (opcoes.filter(({ correta }) => correta === true).length !== 1) {
        throw new BadRequestException(
          'Escolha única deve ter exatamente uma opção correta.',
        );
      }
      return;
    }

    const posicoes = opcoes.map(({ posicaoCorreta }) => posicaoCorreta);
    if (
      posicoes.some((posicao) => posicao === undefined || posicao === null) ||
      new Set(posicoes).size !== posicoes.length
    ) {
      throw new BadRequestException(
        'Ordenação deve ter uma posição correta única para cada opção.',
      );
    }
  }

  private validarConteudoCodigo(tipo: TipoDesafio, conteudo: unknown): void {
    if (tipo !== TipoDesafio.ESCRITA_CODIGO) {
      return;
    }

    if (
      !isRecord(conteudo) ||
      (conteudo['linguagem'] !== 'html' && conteudo['linguagem'] !== 'css') ||
      typeof conteudo['orientacao'] !== 'string' ||
      typeof conteudo['codigoInicial'] !== 'string' ||
      !Array.isArray(conteudo['verificacoes']) ||
      conteudo['verificacoes'].length === 0
    ) {
      throw new BadRequestException(
        'Informe a linguagem, orientação, código inicial e verificações do exercício.',
      );
    }

    const verificacoesValidas = conteudo['verificacoes'].every(
      (verificacao: unknown) => {
        if (!isRecord(verificacao)) {
          return false;
        }

        if (verificacao['tipo'] === 'HTML_ELEMENT') {
          return (
            typeof verificacao['tag'] === 'string' &&
            typeof verificacao['texto'] === 'string'
          );
        }
        if (verificacao['tipo'] === 'HTML_ATTRIBUTE') {
          return (
            typeof verificacao['tag'] === 'string' &&
            typeof verificacao['atributo'] === 'string' &&
            typeof verificacao['valor'] === 'string'
          );
        }
        if (verificacao['tipo'] === 'CSS_DECLARATION') {
          return (
            typeof verificacao['seletor'] === 'string' &&
            typeof verificacao['propriedade'] === 'string' &&
            typeof verificacao['valor'] === 'string'
          );
        }
        if (verificacao['tipo'] === 'CSS_MEDIA_QUERY') {
          return typeof verificacao['condicao'] === 'string';
        }
        return false;
      },
    );
    if (!verificacoesValidas) {
      throw new BadRequestException(
        'As verificações do exercício de código são inválidas.',
      );
    }
  }

  private opcoesParaCriacao(opcoes: readonly AdminOption[]) {
    return opcoes.map((opcao) => ({
      texto: opcao.texto.trim(),
      correta: opcao.correta ?? false,
      posicaoCorreta: opcao.posicaoCorreta ?? null,
    }));
  }

  private async checkHistory(
    progressWhere: Prisma.ProgressoLicaoWhereInput,
    attemptWhere: Prisma.TentativaWhereInput,
  ) {
    const [progressos, tentativas] = await Promise.all([
      this.prisma.progressoLicao.count({ where: progressWhere }),
      this.prisma.tentativa.count({ where: attemptWhere }),
    ]);
    if (progressos > 0 || tentativas > 0) {
      throw new ConflictException(
        'O conteúdo não pode ser removido porque já possui progresso ou tentativas.',
      );
    }
  }

  private async findOrNotFound<T>(
    promise: Promise<T | null>,
    entidade: string,
  ): Promise<T> {
    const registro = await promise;
    if (!registro) {
      throw new NotFoundException(`${entidade} não encontrado(a).`);
    }
    return registro;
  }

  private async run<T>(
    operation: () => Promise<T>,
    action: Operation = 'create',
    entidade = 'Conteúdo',
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um registro com esses dados.');
        }
        if (error.code === 'P2003') {
          throw action === 'delete'
            ? new ConflictException(
                'O conteúdo não pode ser removido devido a registros relacionados.',
              )
            : new BadRequestException(
                'O registro relacionado não foi encontrado.',
              );
        }
        if (error.code === 'P2025' && action !== 'create') {
          throw new NotFoundException(`${entidade} não encontrado(a).`);
        }
      }
      throw error;
    }
  }
}
