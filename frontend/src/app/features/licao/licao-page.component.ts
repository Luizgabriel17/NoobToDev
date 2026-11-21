import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LicoesService } from '../../services/licoes.service';
import { RespostaResultado } from '../../models/licao';

interface CodeEditorContent {
  linguagem: 'html' | 'css';
  orientacao: string;
  codigoInicial: string;
}

function isCodeEditorContent(value: unknown): value is CodeEditorContent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'linguagem' in value &&
    (value['linguagem'] === 'html' || value['linguagem'] === 'css') &&
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

    if (desafio.tipo === 'ESCOLHA_UNICA') {
      return typeof this.respostaAtual() === 'number';
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
      desafio.tipo === 'ESCOLHA_UNICA' && typeof resposta === 'number'
        ? { opcaoId: resposta }
        : desafio.tipo === 'ORDENACAO' && Array.isArray(resposta)
          ? { ordem: resposta }
          : desafio.tipo === 'ESCRITA_CODIGO' && typeof resposta === 'string'
            ? { codigo: resposta }
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

    if (desafio.tipo === 'ORDENACAO') {
      return desafio.opcoes.map((opcao) => opcao.id);
    }

    return null;
  }

  getCodeEditorContent(value: unknown): CodeEditorContent | null {
    return isCodeEditorContent(value) ? value : null;
  }
}
