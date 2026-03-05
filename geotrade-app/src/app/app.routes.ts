import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
import { ExploradorComponent } from './components/explorador/explorador';
import { DashboardEmpresarioComponent } from './components/dashboard-empresario/dashboard-empresario';
import { AdminComponent } from './components/admin/admin';
import { OlvidepasswordComponent } from './components/olvidepassword/olvidepassword'; 

export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'explorador', component: ExploradorComponent },
    { path: 'dashboard-empresario', component: DashboardEmpresarioComponent },
    { path: 'olvidepassword', component: OlvidepasswordComponent },
    
    { path: 'admin', component: AdminComponent }, 
    { path: '**', redirectTo: '' },
];