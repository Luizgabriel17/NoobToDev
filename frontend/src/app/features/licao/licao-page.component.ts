import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LicoesService } from '../../services/licoes.service';
import { RespostaResultado } from '../../models/licao';

interface CodeEditorContent {
  linguagem: 'html' | 'css' | 'javascript';
  orientacao: string;
  codigoInicial: string;
}

interface BlankExerciseContent {
  orientacao: string;
  codigoInicial: string;
}

function isCodeEditorContent(value: unknown): value is CodeEditorContent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'linguagem' in value &&
    (value['linguagem'] === 'html' ||
      value['linguagem'] === 'css' ||
      value['linguagem'] === 'javascript') &&
    'orientacao' in value &&
    typeof value['orientacao'] === 'string' &&
    'codigoInicial' in value &&
    typeof value['codigoInicial'] === 'string'
  );
}

function isBlankExerciseContent(value: unknown): value is BlankExerciseContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'orientacao' in value &&
    typeof value['orientacao'] === 'string' &&
    'codigoInicial' in value &&
    typeof value['codigoInicial'] === 'string'
  );
}

@Component({
  selector: 'app-licao-page',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './licao-page.component.html',
  styleUrl: './licao-page.component.css',
})
export class LicaoPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly licoesService = inject(LicoesService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly licao = this.licoesService.licaoAtual;
  readonly loading = this.licoesService.loading;
  readonly submitting = this.licoesService.submitting;
  readonly error = this.licoesService.error;
  readonly usuario = this.authService.user;
  readonly indiceAtual = signal(0);
  readonly respostaAtual = signal<number | number[] | string | null>(null);
  readonly feedback = signal<RespostaResultado | null>(null);
  readonly resultadoFinal = signal<{
    concluidas?: number;
    concluida: boolean;
    acertos: number;
    total: number;
    xpGanho: number;
    proximaLicaoId: number | null;
  } | null>(null);

  readonly desafioAtual = computed(() => {
    const licaoAtual = this.licao();
    const indice = this.indiceAtual();
    return licaoAtual?.desafios[indice] ?? null;
  });

  readonly podeVerificar = computed(() => {
    const desafio = this.desafioAtual();
    if (!desafio) {
      return false;
    }

    if (
      desafio.tipo === 'ESCOLHA_UNICA' ||
      desafio.tipo === 'ENCONTRAR_ERRO'
    ) {
      return typeof this.respostaAtual() === 'number';
    }

    if (desafio.tipo === 'COMPLETAR_LACUNAS') {
      const resposta = this.respostaAtual();
      return typeof resposta === 'string' && resposta.trim().length > 0;
    }

    if (desafio.tipo === 'ORDENACAO') {
      const ordem = this.respostaAtual();
      return Array.isArray(ordem) && ordem.length === desafio.opcoes.length;
    }

    if (desafio.tipo === 'ESCRITA_CODIGO') {
      const codigo = this.respostaAtual();
      return typeof codigo === 'string' && codigo.trim().length > 0;
    }

    return false;
  });

  readonly temPreviaExemploLicao = computed<boolean>(() => {
    const licao = this.licao();
    if (!licao || !licao.exemploCodigo || this.isLicaoJavaScript()) {
      return false;
    }
    return this.isLicaoHtmlCss();
  });

  readonly previewExemploLicao = computed<SafeHtml>(() => {
    const licao = this.licao();
    if (!licao || !licao.exemploCodigo || this.isLicaoJavaScript()) {
      return '';
    }
    const modulo = licao.moduloTitulo.toLowerCase();
    let doc = '';
    if (modulo.includes('html')) {
      doc = this.gerarHtmlDocumento(licao.exemploCodigo);
    } else if (modulo.includes('css') || modulo.includes('layout')) {
      doc = this.gerarCssDocumento(licao.exemploCodigo);
    }
    return this.sanitizer.bypassSecurityTrustHtml(doc);
  });

  readonly previewExercicioAoVivo = computed<SafeHtml>(() => {
    const desafio = this.desafioAtual();
    if (!desafio || desafio.tipo !== 'ESCRITA_CODIGO') {
      return '';
    }
    const conteudo = this.getCodeEditorContent(desafio.conteudo);
    if (!conteudo) {
      return '';
    }
    const codigo = this.getCodigoAtual();
    let doc = '';
    if (conteudo.linguagem === 'html') {
      doc = this.gerarHtmlDocumento(codigo);
    } else if (conteudo.linguagem === 'css') {
      doc = this.gerarCssDocumento(codigo);
    }
    return this.sanitizer.bypassSecurityTrustHtml(doc);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.carregarLicao(id);
  }

  carregarLicao(id: number): void {
    this.licoesService.carregarLicao(id).subscribe({
      next: () => {
        this.indiceAtual.set(0);
        this.feedback.set(null);
        this.resultadoFinal.set(null);
        this.respostaAtual.set(this.respostaInicial());
      },
      error: () => undefined,
    });
  }

  selecionarOpcao(opcaoId: number): void {
    this.feedback.set(null);
    this.respostaAtual.set(opcaoId);
  }

  atualizarCodigo(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      this.feedback.set(null);
      this.respostaAtual.set(target.value);
    }
  }

  atualizarRespostaTexto(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.feedback.set(null);
      this.respostaAtual.set(target.value);
    }
  }

  getCodigoAtual(): string {
    const resposta = this.respostaAtual();
    return typeof resposta === 'string' ? resposta : '';
  }

  drop(event: CdkDragDrop<number[]>): void {
    const ordem = [...(this.ordemAtual() ?? [])];
    moveItemInArray(ordem, event.previousIndex, event.currentIndex);
    this.respostaAtual.set(ordem);
  }

  moverItem(index: number, direcao: number): void {
    const ordem = [...(this.ordemAtual() ?? [])];
    const novoIndex = index + direcao;

    if (novoIndex < 0 || novoIndex >= ordem.length) {
      return;
    }

    [ordem[index], ordem[novoIndex]] = [ordem[novoIndex], ordem[index]];
    this.respostaAtual.set(ordem);
  }

  verificarResposta(): void {
    const desafio = this.desafioAtual();
    const resposta = this.respostaAtual();
    if (!desafio || !this.podeVerificar()) {
      return;
    }

    const payload =
      (desafio.tipo === 'ESCOLHA_UNICA' ||
        desafio.tipo === 'ENCONTRAR_ERRO') &&
      typeof resposta === 'number'
        ? { opcaoId: resposta }
        : desafio.tipo === 'ORDENACAO' && Array.isArray(resposta)
          ? { ordem: resposta }
          : desafio.tipo === 'ESCRITA_CODIGO' && typeof resposta === 'string'
            ? { codigo: resposta }
            : desafio.tipo === 'COMPLETAR_LACUNAS' &&
                typeof resposta === 'string'
              ? { respostaTexto: resposta }
              : null;
    if (!payload) {
      return;
    }

    this.licoesService.verificarResposta(desafio.id, payload).subscribe((resultado) => {
      this.feedback.set(resultado);
      this.authService.updateXpTotal(resultado.xpTotal);
      if (resultado.licao) {
        this.resultadoFinal.set(resultado.licao);
      }
    });
  }

  continuar(): void {
    if (this.resultadoFinal()) {
      const proximaLicaoId = this.resultadoFinal()?.proximaLicaoId ?? null;
      if (proximaLicaoId) {
        this.router.navigate(['/licao', proximaLicaoId]);
        return;
      }

      this.router.navigate(['/trilha']);
      return;
    }

    const proximoIndice = this.indiceAtual() + 1;
    const total = this.licao()?.desafios.length ?? 0;

    if (proximoIndice >= total) {
      return;
    }

    this.indiceAtual.set(proximoIndice);
    this.feedback.set(null);
    this.respostaAtual.set(this.respostaInicial());
  }

  voltarParaTrilha(): void {
    this.router.navigate(['/trilha']);
  }

  sair(): void {
    this.authService.logout();
  }

  getOpcaoTextoPorId(opcaoId: number): string {
    const desafio = this.desafioAtual();
    return desafio?.opcoes.find((opcao) => opcao.id === opcaoId)?.texto ?? 'Opção';
  }

  ordemAtual(): number[] {
    const ordem = this.respostaAtual();
    return Array.isArray(ordem) ? ordem : [];
  }

  private respostaInicial(): number[] | string | null {
    const desafio = this.desafioAtual();
    if (!desafio) {
      return null;
    }

    if (desafio.tipo === 'ESCRITA_CODIGO' && isCodeEditorContent(desafio.conteudo)) {
      return desafio.conteudo.codigoInicial;
    }

    if (desafio.tipo === 'COMPLETAR_LACUNAS') {
      return '';
    }

    if (desafio.tipo === 'ORDENACAO') {
      return desafio.opcoes.map((opcao) => opcao.id);
    }

    return null;
  }

  getCodeEditorContent(value: unknown): CodeEditorContent | null {
    return isCodeEditorContent(value) ? value : null;
  }

  getBlankExerciseContent(value: unknown): BlankExerciseContent | null {
    return isBlankExerciseContent(value) ? value : null;
  }

  getDesafioTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'ESCRITA_CODIGO':
        return 'Escrita de código';
      case 'ORDENACAO':
        return 'Ordenação';
      case 'COMPLETAR_LACUNAS':
        return 'Complete a lacuna';
      case 'ENCONTRAR_ERRO':
        return 'Encontre o erro';
      default:
        return 'Escolha única';
    }
  }

  getLicaoTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'PROJETO':
        return 'Projeto';
      case 'REVISAO':
        return 'Revisão';
      default:
        return 'Lição';
    }
  }

  isLicaoJavaScript(): boolean {
    const modulo = this.licao()?.moduloTitulo.toLowerCase() ?? '';
    return modulo.includes('javascript') || modulo.includes('js');
  }

  isLicaoHtmlCss(): boolean {
    const modulo = this.licao()?.moduloTitulo.toLowerCase() ?? '';
    return (
      modulo.includes('html') ||
      modulo.includes('css') ||
      modulo.includes('layout')
    );
  }

  gerarHtmlDocumento(codigo: string): string {
    if (!codigo || codigo.trim().length === 0) {
      return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;background:#ffffff;color:#6b7280;padding:1rem;">Digite código HTML para pré-visualizar.</body></html>';
    }
    if (codigo.includes('<!doctype html>') || codigo.includes('<html')) {
      return codigo;
    }
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; color: #111827; background: #ffffff; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  ${codigo}
</body>
</html>`;
  }

  gerarCssDocumento(codigo: string): string {
    if (!codigo || codigo.trim().length === 0) {
      return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;background:#ffffff;color:#6b7280;padding:1rem;">Digite regras CSS para pré-visualizar.</body></html>';
    }

    if (
      codigo.includes('<article') ||
      codigo.includes('<header') ||
      codigo.includes('<main') ||
      codigo.includes('<div') ||
      codigo.includes('<style>')
    ) {
      if (codigo.includes('<!doctype html>') || codigo.includes('<html')) {
        return codigo;
      }
      return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; color: #111827; background: #ffffff; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  ${codigo}
</body>
</html>`;
    }

    const cssLimpo = codigo.replace(/<!--/g, '/*').replace(/-->/g, '*/');
    const demoHtml = this.gerarHtmlParaCss(codigo);

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; color: #111827; background: #ffffff; margin: 0; line-height: 1.5; }
    ${cssLimpo}
  </style>
</head>
<body>
  ${demoHtml}
</body>
</html>`;
  }

  private gerarHtmlParaCss(css: string): string {
    const elementos: string[] = [];
    const classMatches = css.match(/\.([a-zA-Z0-9_-]+)/g);
    const classes = classMatches
      ? Array.from(new Set(classMatches.map((c) => c.slice(1))))
      : [];
    const idMatches = css.match(/#([a-zA-Z0-9_-]+)/g);
    const ids = idMatches
      ? Array.from(new Set(idMatches.map((i) => i.slice(1))))
      : [];

    if (classes.includes('destaque')) {
      elementos.push('<p class="destaque">Texto com a classe .destaque</p>');
      elementos.push('<p>Texto normal sem a classe .destaque para comparação</p>');
    }
    if (classes.includes('aviso')) {
      elementos.push('<p class="aviso">Aviso importante com classe .aviso</p>');
    }
    if (ids.includes('alerta')) {
      elementos.push('<p id="alerta" class="aviso">Elemento com id #alerta e classe .aviso</p>');
    }
    if (classes.includes('cartao')) {
      elementos.push('<div class="cartao"><h3>Cartão</h3><p>Exemplo de bloco com box model estilizado.</p></div>');
    }
    if (classes.includes('conteudo')) {
      elementos.push('<div class="conteudo"><h3>Conteúdo</h3><p>Área centralizada com largura controlada.</p></div>');
    }
    if (classes.includes('menu')) {
      elementos.push('<nav class="menu"><a href="#">Início</a><a href="#">Cursos</a><a href="#">Sobre</a></nav>');
    }
    if (classes.includes('galeria')) {
      elementos.push('<div class="galeria"><div style="background:#e0e7ff;padding:1rem;border-radius:0.5rem;">Item 1</div><div style="background:#e0e7ff;padding:1rem;border-radius:0.5rem;">Item 2</div><div style="background:#e0e7ff;padding:1rem;border-radius:0.5rem;">Item 3</div></div>');
    }
    if (classes.includes('grade')) {
      elementos.push('<div class="grade"><div style="background:#f3f4f6;padding:1rem;border-radius:0.5rem;">Card 1</div><div style="background:#f3f4f6;padding:1rem;border-radius:0.5rem;">Card 2</div></div>');
    }

    const classesTratadas = [
      'destaque',
      'aviso',
      'cartao',
      'conteudo',
      'menu',
      'galeria',
      'grade',
    ];
    for (const cls of classes) {
      if (!classesTratadas.includes(cls)) {
        elementos.push(`<div class="${cls}">Elemento estilizado com class="${cls}"</div>`);
      }
    }

    for (const id of ids) {
      if (id !== 'alerta') {
        elementos.push(`<div id="${id}">Elemento com id="${id}"</div>`);
      }
    }

    if (elementos.length === 0) {
      if (css.includes('p {') || css.includes('p{')) {
        elementos.push('<p>Parágrafo de exemplo com regra de tag CSS p.</p>');
      }
      if (
        css.includes('h1 {') ||
        css.includes('h1{') ||
        css.includes('h2 {') ||
        css.includes('h2{')
      ) {
        elementos.push('<h2>Título de exemplo com estilo</h2>');
      }
      if (css.includes('button {') || css.includes('button{')) {
        elementos.push('<button type="button">Botão de exemplo</button>');
      }
    }

    if (elementos.length === 0) {
      elementos.push('<div class="demo-box"><p>Pré-visualização do estilo aplicado.</p></div>');
    }

    return elementos.join('\n');
  }
}
