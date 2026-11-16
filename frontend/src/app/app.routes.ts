import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/trilha', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'trilha',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trilha/trilha-page.component').then((m) => m.TrilhaPageComponent),
  },
  {
    path: 'licao/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/licao/licao-page.component').then((m) => m.LicaoPageComponent),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil-page.component').then((m) => m.PerfilPageComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
