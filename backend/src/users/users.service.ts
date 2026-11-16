import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nome: dto.nome.trim(),
          email,
          senhaHash,
          ...(dto.papel ? { papel: dto.papel } : {}),
        },
      });
      return this.publico(usuario);
    } catch (error) {
      this.throwForKnownUserError(error);
    }
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: this.publicFields,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: this.publicFields,
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return usuario;
  }

  async update(id: number, dto: UpdateUserDto) {
    const { senha, ...campos } = dto;
    const data = {
      ...campos,
      ...(campos.nome ? { nome: campos.nome.trim() } : {}),
      ...(campos.email ? { email: campos.email.trim().toLowerCase() } : {}),
      ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}),
    };

    try {
      const usuario = await this.prisma.usuario.update({
        where: { id },
        data,
      });
      return this.publico(usuario);
    } catch (error) {
      this.throwForKnownUserError(error, id);
    }
  }

  async remove(id: number) {
    try {
      const usuario = await this.prisma.usuario.delete({ where: { id } });
      return this.publico(usuario);
    } catch (error) {
      this.throwForKnownUserError(error, id);
    }
  }

  private readonly publicFields = {
    id: true,
    nome: true,
    email: true,
    papel: true,
    xpTotal: true,
    criadoEm: true,
    atualizadoEm: true,
  } satisfies Prisma.UsuarioSelect;

  private publico(usuario: Usuario) {
    const { senhaHash: _senhaHash, ...publico } = usuario;
    return publico;
  }

  private throwForKnownUserError(error: unknown, id?: number): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      if (error.code === 'P2025' && id !== undefined) {
        throw new NotFoundException('Usuário não encontrado.');
      }
    }
    throw error;
  }
}
