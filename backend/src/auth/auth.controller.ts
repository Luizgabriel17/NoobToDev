import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  perfil(@Req() req: { user: { id: number } }) {
    return this.auth.perfil(req.user.id);
  }
}

// Controlador de autenticação
// Define as regras das rotas de autenticação
// @Controller('auth') - Define a rota base para autenticação
// @Post('register') - Define a rota para registro de usuário
// @Post('login') - Define a rota para login de usuário
// @UseGuards(JwtAuthGuard) - Protege a rota com autenticação JWT
// @Get('me') - Define a rota para obter informações do usuário logado
// @Body() - Extrai os dados do corpo da requisição
// @Req() - Extrai os dados da requisição
// HttpCode(200) - Define o código de status HTTP para a resposta