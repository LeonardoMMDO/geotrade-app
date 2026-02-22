import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
// AGREGA ESTAS DOS LÍNEAS:
import { ExploradorComponent } from './components/explorador/explorador';
import { DashboardEmpresarioComponent } from './components/dashboard-empresario/dashboard-empresario';

export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    // AGREGA ESTAS DOS RUTAS:
    { path: 'explorador', component: ExploradorComponent },
    { path: 'dashboard-empresario', component: DashboardEmpresarioComponent },
    { path: '**', redirectTo: '' }
];