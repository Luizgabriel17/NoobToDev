import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nome: dto.nome.trim(), email, senhaHash },
    });

    return this.publico(usuario);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    const senhaCorreta = usuario
      ? await bcrypt.compare(dto.senha, usuario.senhaHash)
      : false;

    if (!usuario || !senhaCorreta) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const accessToken = await this.jwt.signAsync({
      sub: usuario.id,
      papel: usuario.papel,
    });

    return { accessToken, usuario: this.publico(usuario) };
  }

  async perfil(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new UnauthorizedException();
    }
    return this.publico(usuario);
  }

  // Nunca devolva o hash da senha para o cliente
  private publico(usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      xpTotal: usuario.xpTotal,
      papel: usuario.papel,
    };
  }
}