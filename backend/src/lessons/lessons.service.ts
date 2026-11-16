import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLessonDto) {
    try {
      return await this.prisma.licao.create({
        data: {
          moduloId: dto.moduloId,
          titulo: dto.titulo.trim(),
          ordem: dto.ordem,
          publicada: dto.publicada ?? false,
        },
      });
    } catch (error) {
      this.throwForKnownLessonError(error, 'create');
    }
  }

  findAll() {
    return this.prisma.licao.findMany({
      orderBy: [{ moduloId: 'asc' }, { ordem: 'asc' }],
    });
  }

  async findOne(id: number) {
    const licao = await this.prisma.licao.findUnique({ where: { id } });
    if (!licao) {
      throw new NotFoundException('Lição não encontrada.');
    }
    return licao;
  }

  async update(id: number, dto: UpdateLessonDto) {
    try {
      return await this.prisma.licao.update({
        where: { id },
        data: {
          ...(dto.moduloId !== undefined ? { moduloId: dto.moduloId } : {}),
          ...(dto.titulo ? { titulo: dto.titulo.trim() } : {}),
          ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
          ...(dto.publicada !== undefined ? { publicada: dto.publicada } : {}),
        },
      });
    } catch (error) {
      this.throwForKnownLessonError(error, 'update');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.licao.delete({ where: { id } });
    } catch (error) {
      this.throwForKnownLessonError(error, 'delete');
    }
  }

  private throwForKnownLessonError(
    error: unknown,
    operation: 'create' | 'update' | 'delete',
  ): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Já existe uma lição com esta ordem neste módulo.',
        );
      }
      if (error.code === 'P2003') {
        throw operation === 'delete'
          ? new ConflictException(
              'A lição não pode ser removida devido a registros relacionados.',
            )
          : new BadRequestException('Módulo não encontrado.');
      }
      if (error.code === 'P2025' && operation !== 'create') {
        throw new NotFoundException('Lição não encontrada.');
      }
    }
    throw error;
  }
}
