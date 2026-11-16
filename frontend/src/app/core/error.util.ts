import { HttpErrorResponse } from '@angular/common/http';

export function mensagemDeErro(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    if (error.status === 0) {
      return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
    }

    const status = error.status;
    if (status === 401) {
      return 'E-mail ou senha incorretos. Faça login novamente se sua sessão expirou.';
    }
    if (status === 403) {
      return 'Você não tem permissão para acessar este conteúdo.';
    }
    if (status === 404) {
      return 'Conteúdo não encontrado.';
    }
    if (status === 409) {
      return 'Já existe um cadastro com esses dados.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : 0;
  if (status === 401) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (status === 403) {
    return 'Você não tem permissão para acessar este conteúdo.';
  }
  if (status === 404) {
    return 'Conteúdo não encontrado.';
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.';
}
