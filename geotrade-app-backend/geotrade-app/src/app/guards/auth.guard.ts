import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const raw = sessionStorage.getItem('usuario'); // ← sessionStorage

  if (raw) return true;

  router.navigate(['/login']);
  return false;
};

export const rolGuard = (rolesPermitidos: string[]): CanActivateFn => () => {
  const router = inject(Router);
  const raw = sessionStorage.getItem('usuario'); // ← sessionStorage

  if (!raw) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const usuario = JSON.parse(raw);
    const rol = (usuario.rol || '').toLowerCase();

    if (rolesPermitidos.includes(rol)) return true;

    const rutasPorRol: Record<string, string> = {
      admin: '/admin',
      empresario: '/dashboard-empresario',
      explorador: '/explorador',
      usuario: '/explorador',
    };

    router.navigate([rutasPorRol[rol] ?? '/login']);
    return false;

  } catch {
    sessionStorage.clear();
    router.navigate(['/login']);
    return false;
  }
};

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const raw = sessionStorage.getItem('usuario');

  if (!raw) return true;

  try {
    const usuario = JSON.parse(raw);
    const rol = (usuario.rol || '').toLowerCase();

    const rutasPorRol: Record<string, string> = {
      admin: '/admin',
      empresario: '/dashboard-empresario',
      explorador: '/explorador',
      usuario: '/explorador',
    };

    router.navigate([rutasPorRol[rol] ?? '/explorador']);
    return false;

  } catch {
    return true;
  }
};