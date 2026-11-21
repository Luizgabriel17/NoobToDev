import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LicoesService } from '../../services/licoes.service';
import { LicaoDetalhe } from '../../models/licao';
import { LicaoPageComponent } from './licao-page.component';

const mockLicaoHtml: LicaoDetalhe = {
  id: 1,
  titulo: 'Estrutura básica',
  moduloTitulo: 'HTML essencial',
  status: 'DISPONIVEL',
  tipo: 'CONTEUDO',
  explicacao: 'HTML organiza o conteúdo através de elementos e tags.',
  exemploCodigo: '<h1>Título</h1>\n<p>Parágrafo explicativo</p>',
  exemploResultado: 'Apresenta um título de nível 1 seguido por um parágrafo.',
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
        { id: 101, texto: '<h1>' },
        { id: 102, texto: '<p>' },
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
        { id: 201, texto: '<html>' },
        { id: 202, texto: '<head>' },
        { id: 203, texto: '<body>' },
      ],
    },
    {
      id: 13,
      ordem: 3,
      tipo: 'COMPLETAR_LACUNAS',
      enunciado: 'Complete o atributo que descreve uma imagem.',
      pontos: 10,
      conteudo: {
        orientacao: 'Digite o nome do atributo.',
        codigoInicial: '<img src="gato.jpg" ___="Gato dormindo">',
      },
      respondido: false,
      opcoes: [],
    },
    {
      id: 14,
      ordem: 4,
      tipo: 'ENCONTRAR_ERRO',
      enunciado: 'Encontre o erro: qual opção usa a sintaxe correta?',
      pontos: 10,
      conteudo: null,
      respondido: false,
      opcoes: [
        { id: 301, texto: '<p>Texto correto</p>' },
        { id: 302, texto: '<p>Texto sem fechar' },
      ],
    },
    {
      id: 15,
      ordem: 5,
      tipo: 'ESCRITA_CODIGO',
      enunciado: 'Escreva um parágrafo com texto explicativo.',
      pontos: 10,
      conteudo: {
        linguagem: 'html',
        orientacao: 'Use a tag p.',
        codigoInicial: '<p>Meu código inicial</p>',
      },
      respondido: false,
      opcoes: [],
    },
  ],
};

const mockLicaoJs: LicaoDetalhe = {
  id: 2,
  titulo: 'Variáveis e Operadores',
  moduloTitulo: 'JavaScript básico',
  status: 'DISPONIVEL',
  tipo: 'CONTEUDO',
  explicacao: 'JavaScript permite armazenar valores e realizar cálculos.',
  exemploCodigo: 'const preco = 10;\nlet quantidade = 2;\nconsole.log(preco * quantidade);',
  exemploResultado: 'O console exibe o valor 20.',
  desafios: [
    {
      id: 21,
      ordem: 1,
      tipo: 'ESCRITA_CODIGO',
      enunciado: 'Declare const total = 100;',
      pontos: 10,
      conteudo: {
        linguagem: 'javascript',
        orientacao: 'Declare a constante pedida.',
        codigoInicial: 'const total = 0;',
      },
      respondido: false,
      opcoes: [],
    },
  ],
};

describe('LicaoPageComponent', () => {
  let fixture: ComponentFixture<LicaoPageComponent>;
  let component: LicaoPageComponent;
  let mockLicoesService: {
    licaoAtual: ReturnType<typeof signal<LicaoDetalhe | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    submitting: ReturnType<typeof signal<boolean>>;
    carregarLicao: ReturnType<typeof vi.fn>;
    verificarResposta: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockLicoesService = {
      licaoAtual: signal<LicaoDetalhe | null>(mockLicaoHtml),
      loading: signal(false),
      error: signal(null),
      submitting: signal(false),
      carregarLicao: vi.fn(() => of(mockLicaoHtml)),
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
              papel: 'ESTUDANTE',
            }),
            logout: vi.fn(),
            updateXpTotal: vi.fn(),
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LicaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza mini-explicação, exemplo de código comentado e resultado guiado da API', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('HTML organiza o conteúdo através de elementos');
    expect(text).toContain('<h1>Título</h1>');
    expect(text).toContain('Apresenta um título de nível 1 seguido por um parágrafo');
  });

  it('exibe pré-visualização renderizada protegida em iframe com sandbox sem scripts para HTML/CSS', () => {
    const iframe = fixture.nativeElement.querySelector('.example-preview-container iframe') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute('sandbox')).toBe('');
    expect(iframe.srcdoc).toContain('<h1>Título</h1>');
  });

  it('não executa código JavaScript nem renderiza iframe para lições de JS', () => {
    mockLicoesService.licaoAtual.set(mockLicaoJs);
    fixture.detectChanges();

    const iframes = fixture.nativeElement.querySelectorAll('iframe');
    expect(iframes.length).toBe(0);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Análise estática');
    expect(text).toContain('sem executar código no navegador');
  });

  it('permite editar código HTML/CSS e atualiza prévia ao vivo em iframe sandboxed', () => {
    component.indiceAtual.set(4); // Desafio 5: ESCRITA_CODIGO HTML
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('#code-answer') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.value).toBe('<p>Meu código inicial</p>');

    const liveIframe = fixture.nativeElement.querySelector('.live-preview-frame') as HTMLIFrameElement;
    expect(liveIframe).not.toBeNull();
    expect(liveIframe.getAttribute('sandbox')).toBe('');
    expect(liveIframe.srcdoc).toContain('<p>Meu código inicial</p>');

    textarea.value = '<p>Texto atualizado pelo estudante</p>';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(String(component.previewExercicioAoVivo())).toContain('Texto atualizado pelo estudante');
  });

  it('renderiza desafio de completar lacunas com acessibilidade e submete respostaTexto', () => {
    mockLicoesService.verificarResposta.mockReturnValue(
      of({
        acertou: true,
        xpGanho: 10,
        explicacao: 'alt descreve a imagem com acessibilidade.',
        dica: null,
        xpTotal: 50,
        licao: null,
      }),
    );

    component.indiceAtual.set(2);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label[for="blank-answer"]');
    const input = fixture.nativeElement.querySelector('#blank-answer') as HTMLInputElement;

    expect(label).not.toBeNull();
    expect(input).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Complete a lacuna');

    input.value = 'alt';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.podeVerificar()).toBe(true);
    component.verificarResposta();

    expect(mockLicoesService.verificarResposta).toHaveBeenCalledWith(13, {
      respostaTexto: 'alt',
    });
  });

  it('classifica desafio de encontrar erro corretamente e submete opcaoId', () => {
    mockLicoesService.verificarResposta.mockReturnValue(
      of({
        acertou: true,
        xpGanho: 10,
        explicacao: 'Tags p devem ser fechadas.',
        dica: null,
        xpTotal: 50,
        licao: null,
      }),
    );

    component.indiceAtual.set(3); // Desafio 4: ENCONTRAR_ERRO
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Encontre o erro');
    expect(fixture.nativeElement.querySelector('.challenge-type').textContent).toContain('Encontre o erro');

    component.selecionarOpcao(301);
    expect(component.podeVerificar()).toBe(true);

    component.verificarResposta();
    expect(mockLicoesService.verificarResposta).toHaveBeenCalledWith(14, {
      opcaoId: 301,
    });
  });

  it('exibe feedback explicativo com dica em caso de erro sem liberar avanço nem expor gabarito', () => {
    mockLicoesService.verificarResposta.mockReturnValue(
      of({
        acertou: false,
        xpGanho: 0,
        explicacao: 'Revise os seletores.',
        dica: 'Lembre-se da tag h1.',
        xpTotal: 40,
        licao: null,
      }),
    );

    component.indiceAtual.set(0);
    component.respostaAtual.set(102);
    component.verificarResposta();
    fixture.detectChanges();

    expect(component.feedback()?.acertou).toBe(false);
    expect(component.feedback()?.dica).toBe('Lembre-se da tag h1.');
    expect(fixture.nativeElement.querySelector('.action-row .btn-success')).toBeNull();
  });
});
