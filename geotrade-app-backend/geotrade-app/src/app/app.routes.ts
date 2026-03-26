import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
import { ExploradorComponent } from './components/explorador/explorador';
import { DashboardEmpresarioComponent } from './components/dashboard-empresario/dashboard-empresario';
import { AdminComponent } from './components/admin/admin';
import { OlvidepasswordComponent } from './components/olvidepassword/olvidepassword';
import { Contactanos } from './components/contactanos/contactanos';
import { Nosotros } from './components/nosotros/nosotros';
import { PoliticasComponent } from './components/politicas/politicas';
import { authGuard, rolGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Rutas públicas sin restricción ──
  { path: '', component: InicioComponent },
  { path: 'contactanos', component: Contactanos },
  { path: 'nosotros', component: Nosotros },
  { path: 'politicas', component: PoliticasComponent },

  // ── Rutas públicas pero si ya tienes sesión te redirige a tu panel ──
  { path: 'login',          component: LoginComponent,          canActivate: [noAuthGuard] },
  { path: 'registro',       component: RegistroComponent,       canActivate: [noAuthGuard] },
  { path: 'olvidepassword', component: OlvidepasswordComponent, canActivate: [noAuthGuard] },

  // ── Rutas protegidas por rol ──
  {
    path: 'explorador',
    component: ExploradorComponent,
    canActivate: [rolGuard(['explorador', 'usuario'])]
  },
  {
    path: 'dashboard-empresario',
    component: DashboardEmpresarioComponent,
    canActivate: [rolGuard(['empresario'])]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [rolGuard(['admin'])]
  },

  // ── Ruta no encontrada ──
  { path: '**', redirectTo: '/login' },
];