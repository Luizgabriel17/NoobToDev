export function mensagemDeErro(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: number }).status) : 0;
  if (status === 401) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (status === 403) {
    return 'Você não tem permissão para acessar este conteúdo.';
  }
  if (status === 404) {
    return 'Conteúdo não encontrado.';
  }

  return 'Não foi possível carregar os dados. Tente novamente.';
}
