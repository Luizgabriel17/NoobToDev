import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty ({message: "Informe seu nome para registro"})
    nome!: string;

    @IsEmail ({}, {message: "Informe o email para registro"})
    email!: string;

    @IsString()
    @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres" })
    @MaxLength(12, { message: "A senha deve ter no máximo 12 caracteres" })
    senha!: string;
}
export class LoginDto {
    @IsEmail ({}, {message: "Informe o email válido para login"})
    email!: string;

    @IsString()
    @IsNotEmpty ({message: "Informe a senha para login"})
    senha!: string;
}

// Os DTOs (sigla para Objeto de Transferência de dados) são classe que definem a estrutura dos dados da API
// Vão ser usados para validar os dados recebidos do cliente
// E para definir o que será devolvido para o cliente
