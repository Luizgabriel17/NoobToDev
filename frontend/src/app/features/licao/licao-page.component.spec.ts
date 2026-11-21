import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LicoesService } from '../../services/licoes.service';
import { LicaoPageComponent } from './licao-page.component';

const mockLicao = {
  id: 1,
  titulo: 'Estrutura básica',
  moduloTitulo: 'Introdução ao HTML',
  status: 'DISPONIVEL',
  tipo: 'CONTEUDO',
  explicacao: null,
  exemploCodigo: null,
  exemploResultado: null,
  desafios: [
    {
      id: 11,
      ordem: 1,
      tipo: 'ESCOLHA_UNICA',
      enunciado: 'Qual tag cria o título principal de uma página?',
      pontos: 10,
      conteudo: null,
      respondido: false,
      opcoes: [
        { id: 101, texto: '<h1>', correta: true },
        { id: 102, texto: '<p>', correta: false },
      ],
    },
    {
      id: 12,
      ordem: 2,
      tipo: 'ORDENACAO',
      enunciado: 'Organize a estrutura básica.',
      pontos: 15,
      conteudo: null,
      respondido: false,
      opcoes: [
        { id: 201, texto: '<html>', posicaoCorreta: 1 },
        { id: 202, texto: '<head>', posicaoCorreta: 2 },
        { id: 203, texto: '<body>', posicaoCorreta: 3 },
      ],
    },
  ],
};

describe('LicaoPageComponent', () => {
  let fixture: ComponentFixture<LicaoPageComponent>;
  let component: LicaoPageComponent;
  let mockLicoesService: {
    licaoAtual: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    carregarLicao: ReturnType<typeof vi.fn>;
    verificarResposta: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockLicoesService = {
      licaoAtual: signal(mockLicao),
      loading: signal(false),
      error: signal(null),
      carregarLicao: vi.fn(() => of(mockLicao)),
      verificarResposta: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LicaoPageComponent],
      providers: [
        { provide: LicoesService, useValue: mockLicoesService },
        {
          provide: AuthService,
          useValue: {
            user: signal({
              id: 1,
              nome: 'Ana',
              email: 'ana@teste.com',
              xpTotal: 40,
              papel: 'STUDENT',
            }),
            logout: vi.fn(),
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LicaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should advance to the next challenge when continue is clicked', () => {
    component.indiceAtual.set(0);
    component.feedback.set({
      acertou: true,
      xpGanho: 10,
      explicacao: 'Ótimo',
      dica: null,
      xpTotal: 40,
      licao: null,
    });

    component.continuar();

    expect(component.indiceAtual()).toBe(1);
    expect(component.feedback()).toBeNull();
  });

  it('should enable the verify button when the answer is filled in', () => {
    component.indiceAtual.set(0);
    component.respostaAtual.set(101);

    expect(component.podeVerificar()).toBe(true);
  });

  it('should reorder the blocks when moving them with the buttons', () => {
    component.indiceAtual.set(1);
    component.respostaAtual.set([201, 202, 203]);

    component.moverItem(0, 1);

    expect(component.ordemAtual()).toEqual([202, 201, 203]);
  });

  it('should show success feedback after a correct answer', () => {
    mockLicoesService.verificarResposta.mockReturnValue(
      of({
        acertou: true,
        xpGanho: 10,
        explicacao: 'Resposta correta.',
        dica: null,
        xpTotal: 50,
        licao: null,
      }),
    );

    component.indiceAtual.set(0);
    component.respostaAtual.set(101);
    component.verificarResposta();

    expect(component.feedback()?.acertou).toBe(true);
    expect(component.feedback()?.xpGanho).toBe(10);
  });

  it('should show instructional feedback and allow retry without revealing the answer', () => {
    mockLicoesService.verificarResposta.mockReturnValue(
      of({
        acertou: false,
        xpGanho: 0,
        explicacao: 'Use o elemento para o título de maior nível.',
        dica: 'Procure a tag que começa com h.',
        xpTotal: 40,
        licao: null,
      }),
    );

    component.indiceAtual.set(0);
    component.respostaAtual.set(102);
    component.verificarResposta();

    expect(component.feedback()?.acertou).toBe(false);
    expect(component.feedback()?.dica).toBe('Procure a tag que começa com h.');
    expect(fixture.nativeElement.textContent).not.toContain('<h1>');
    expect(fixture.nativeElement.querySelector('.action-row .btn-success')).toBeNull();
  });
});
