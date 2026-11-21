import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { TrilhasService } from '../../services/trilhas.service';
import { Trilha } from '../../models/trilha';
import { TrilhaPageComponent } from './trilha-page.component';

const mockTrilhas: Trilha[] = [
  {
    id: 1,
    titulo: 'Fundamentos Web',
    linguagem: { id: 1, nome: 'HTML, CSS & JS', slug: 'web' },
    progresso: { concluidas: 1, total: 3, percentual: 33 },
    modulos: [
      {
        id: 10,
        titulo: 'HTML Essencial',
        ordem: 1,
        xpGanho: 30,
        emBreve: false,
        licoes: [
          {
            id: 101,
            titulo: 'Estrutura básica',
            ordem: 1,
            tipo: 'CONTEUDO',
            status: 'CONCLUIDA',
            xpGanho: 30,
          },
          {
            id: 102,
            titulo: 'Projeto: Meu Diário',
            ordem: 2,
            tipo: 'PROJETO',
            status: 'DISPONIVEL',
            xpGanho: 0,
          },
          {
            id: 103,
            titulo: 'Revisão de Tags',
            ordem: 3,
            tipo: 'REVISAO',
            status: 'BLOQUEADA',
            xpGanho: 0,
          },
        ],
      },
      {
        id: 20,
        titulo: 'TypeScript introdutório',
        ordem: 2,
        xpGanho: 0,
        emBreve: true,
        licoes: [],
      },
      {
        id: 30,
        titulo: 'Módulo Sem Aulas',
        ordem: 3,
        xpGanho: 0,
        emBreve: false,
        licoes: [],
      },
    ],
  },
];

describe('TrilhaPageComponent', () => {
  let fixture: ComponentFixture<TrilhaPageComponent>;
  let component: TrilhaPageComponent;
  let mockTrilhasService: {
    trilhas: ReturnType<typeof signal<Trilha[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    carregarTrilhas: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockTrilhasService = {
      trilhas: signal(mockTrilhas),
      loading: signal(false),
      error: signal(null),
      carregarTrilhas: vi.fn(() => of(mockTrilhas)),
    };

    await TestBed.configureTestingModule({
      imports: [TrilhaPageComponent],
      providers: [
        provideRouter([]),
        { provide: TrilhasService, useValue: mockTrilhasService },
        {
          provide: AuthService,
          useValue: {
            user: signal({
              id: 1,
              nome: 'Estudante',
              email: 'estudante@teste.com',
              xpTotal: 75,
              papel: 'ESTUDANTE',
            }),
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrilhaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe o XP acumulado por módulo e o XP ganho por lição a partir dos dados da API', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('30 XP obtido');
    expect(textContent).toContain('30 XP');
    expect(textContent).toContain('75');
  });

  it('identifica visualmente lições de projeto e revisão sem codificar conteúdo fixo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const projectNode = compiled.querySelector('.lesson-node.is-project');
    const reviewNode = compiled.querySelector('.lesson-node.is-review');

    expect(projectNode).not.toBeNull();
    expect(projectNode?.textContent).toContain('Projeto');
    expect(projectNode?.textContent).toContain('Projeto: Meu Diário');

    expect(reviewNode).not.toBeNull();
    expect(reviewNode?.textContent).toContain('Revisão');
    expect(reviewNode?.textContent).toContain('Revisão de Tags');
  });

  it('mostra módulos emBreve de forma explícita e distingue de módulos vazios por erro', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const comingSoonBlock = compiled.querySelector('.module-coming-soon-card');
    expect(comingSoonBlock).not.toBeNull();
    expect(comingSoonBlock?.textContent).toContain('TypeScript introdutório');
    expect(comingSoonBlock?.textContent).toContain('Este módulo está estruturado no currículo e será publicado em breve');

    const errorAlert = compiled.querySelector('.alert-warning');
    expect(errorAlert).not.toBeNull();
    expect(errorAlert?.textContent).toContain('Nenhuma lição encontrada para este módulo');
  });

  it('preserva o bloqueio de lições controladas pelo servidor', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const blockedButton = compiled.querySelector('.lesson-node.is-blocked') as HTMLButtonElement;

    expect(blockedButton).not.toBeNull();
    expect(blockedButton.disabled).toBe(true);
    expect(blockedButton.title).toContain('Complete a lição anterior');
  });
});
