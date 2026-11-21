import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { TrilhasService } from '../../services/trilhas.service';

@Component({
  selector: 'app-trilha-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trilha-page.component.html',
  styleUrl: './trilha-page.component.css',
})
export class TrilhaPageComponent implements OnInit {
  private readonly trilhasService = inject(TrilhasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly trilhas = this.trilhasService.trilhas;
  readonly loading = this.trilhasService.loading;
  readonly error = this.trilhasService.error;
  readonly usuario = this.authService.user;

  ngOnInit(): void {
    this.trilhasService.carregarTrilhas().subscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  abrirPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  getMotivoBloqueio(): string {
    return 'Complete a lição anterior para desbloquear esta etapa.';
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
}
