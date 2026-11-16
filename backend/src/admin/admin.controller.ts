import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Papel } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateDesafioDto,
  CreateLicaoDto,
  CreateLinguagemDto,
  CreateModuloDto,
  CreateTrilhaDto,
  UpdateDesafioDto,
  UpdateLicaoDto,
  UpdateLinguagemDto,
  UpdateModuloDto,
  UpdateTrilhaDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

const idPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('O id deve ser um número inteiro.'),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Papel.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('linguagens')
  listarLinguagens() {
    return this.admin.listarLinguagens();
  }

  @Get('linguagens/:id')
  buscarLinguagem(@Param('id', idPipe) id: number) {
    return this.admin.buscarLinguagem(id);
  }

  @Post('linguagens')
  criarLinguagem(@Body() dto: CreateLinguagemDto) {
    return this.admin.criarLinguagem(dto);
  }

  @Patch('linguagens/:id')
  atualizarLinguagem(
    @Param('id', idPipe) id: number,
    @Body() dto: UpdateLinguagemDto,
  ) {
    return this.admin.atualizarLinguagem(id, dto);
  }

  @Delete('linguagens/:id')
  excluirLinguagem(@Param('id', idPipe) id: number) {
    return this.admin.excluirLinguagem(id);
  }

  @Get('trilhas')
  listarTrilhas() {
    return this.admin.listarTrilhas();
  }

  @Get('trilhas/:id')
  buscarTrilha(@Param('id', idPipe) id: number) {
    return this.admin.buscarTrilha(id);
  }

  @Post('trilhas')
  criarTrilha(@Body() dto: CreateTrilhaDto) {
    return this.admin.criarTrilha(dto);
  }

  @Patch('trilhas/:id')
  atualizarTrilha(
    @Param('id', idPipe) id: number,
    @Body() dto: UpdateTrilhaDto,
  ) {
    return this.admin.atualizarTrilha(id, dto);
  }

  @Delete('trilhas/:id')
  excluirTrilha(@Param('id', idPipe) id: number) {
    return this.admin.excluirTrilha(id);
  }

  @Get('modulos')
  listarModulos() {
    return this.admin.listarModulos();
  }

  @Get('modulos/:id')
  buscarModulo(@Param('id', idPipe) id: number) {
    return this.admin.buscarModulo(id);
  }

  @Post('modulos')
  criarModulo(@Body() dto: CreateModuloDto) {
    return this.admin.criarModulo(dto);
  }

  @Patch('modulos/:id')
  atualizarModulo(
    @Param('id', idPipe) id: number,
    @Body() dto: UpdateModuloDto,
  ) {
    return this.admin.atualizarModulo(id, dto);
  }

  @Delete('modulos/:id')
  excluirModulo(@Param('id', idPipe) id: number) {
    return this.admin.excluirModulo(id);
  }

  @Get('licoes')
  listarLicoes() {
    return this.admin.listarLicoes();
  }

  @Get('licoes/:id')
  buscarLicao(@Param('id', idPipe) id: number) {
    return this.admin.buscarLicao(id);
  }

  @Post('licoes')
  criarLicao(@Body() dto: CreateLicaoDto) {
    return this.admin.criarLicao(dto);
  }

  @Patch('licoes/:id')
  atualizarLicao(
    @Param('id', idPipe) id: number,
    @Body() dto: UpdateLicaoDto,
  ) {
    return this.admin.atualizarLicao(id, dto);
  }

  @Delete('licoes/:id')
  excluirLicao(@Param('id', idPipe) id: number) {
    return this.admin.excluirLicao(id);
  }

  @Get('desafios')
  listarDesafios() {
    return this.admin.listarDesafios();
  }

  @Get('desafios/:id')
  buscarDesafio(@Param('id', idPipe) id: number) {
    return this.admin.buscarDesafio(id);
  }

  @Post('desafios')
  criarDesafio(@Body() dto: CreateDesafioDto) {
    return this.admin.criarDesafio(dto);
  }

  @Patch('desafios/:id')
  atualizarDesafio(
    @Param('id', idPipe) id: number,
    @Body() dto: UpdateDesafioDto,
  ) {
    return this.admin.atualizarDesafio(id, dto);
  }

  @Delete('desafios/:id')
  excluirDesafio(@Param('id', idPipe) id: number) {
    return this.admin.excluirDesafio(id);
  }
}
