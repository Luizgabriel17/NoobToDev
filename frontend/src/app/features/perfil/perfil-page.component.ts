import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './perfil-page.component.html',
  styleUrl: './perfil-page.component.css',
})
export class PerfilPageComponent implements OnInit {
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly perfil = this.perfilService.perfil;
  readonly loading = this.perfilService.loading;
  readonly error = this.perfilService.error;
  readonly usuario = this.authService.user;

  ngOnInit(): void {
    this.perfilService.carregarPerfil().subscribe();
  }

  voltarParaTrilha(): void {
    this.router.navigate(['/trilha']);
  }

  sair(): void {
    this.authService.logout();
  }
}
