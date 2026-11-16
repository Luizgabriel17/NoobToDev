import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LicoesService } from '../../services/licoes.service';
import { RespostaResultado } from '../../models/licao';

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
  readonly respostaAtual = signal<number | number[] | null>(null);
  readonly feedback = signal<RespostaResultado | null>(null);
  readonly resultadoFinal = signal<{ concluidas?: number; concluida: boolean; acertos: number; total: number; xpGanho: number; proximaLicaoId: number | null } | null>(null);

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
    if (!desafio || !this.podeVerificar()) {
      return;
    }

    const payload =
      desafio.tipo === 'ESCOLHA_UNICA'
        ? { opcaoId: Number(this.respostaAtual()) }
        : { ordem: this.respostaAtual() as number[] };

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

  getRespostaCorretaTexto(): string {
    const correta = this.feedback()?.respostaCorreta;
    const desafio = this.desafioAtual();

    if (!desafio || !correta) {
      return 'Resposta correta não disponível.';
    }

    if ('opcaoId' in correta) {
      const opcao = desafio.opcoes.find((item) => item.id === correta.opcaoId);
      return opcao?.texto ?? 'Opção correta';
    }

    const ordem = correta.ordem ?? [];
    const texto = desafio.opcoes
      .filter((opcao) => ordem.includes(opcao.id))
      .sort((a, b) => (ordem.indexOf(a.id) ?? 0) - (ordem.indexOf(b.id) ?? 0))
      .map((opcao) => opcao.texto)
      .join(' → ');

    return texto || 'Ordem correta';
  }

  getOpcaoTextoPorId(opcaoId: number): string {
    const desafio = this.desafioAtual();
    return desafio?.opcoes.find((opcao) => opcao.id === opcaoId)?.texto ?? 'Opção';
  }

  ordemAtual(): number[] {
    const ordem = this.respostaAtual();
    return Array.isArray(ordem) ? ordem : [];
  }

  private respostaInicial(): number[] | null {
    const desafio = this.desafioAtual();
    if (!desafio) {
      return null;
    }

    if (desafio.tipo === 'ORDENACAO') {
      return desafio.opcoes.map((opcao) => opcao.id);
    }

    return null;
  }
}
