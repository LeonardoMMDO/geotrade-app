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
import { TerminosComponent } from './components/terminos/terminos';

export const routes: Routes = [
    { path: '', component: InicioComponent },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'explorador', component: ExploradorComponent },
    { path: 'dashboard-empresario', component: DashboardEmpresarioComponent },
    { path: 'olvidepassword', component: OlvidepasswordComponent },
    { path: 'contactanos', component: Contactanos },
    { path: 'nosotros', component: Nosotros },

    { path: 'admin', component: AdminComponent },
    { path: 'terminos', component: TerminosComponent },
    { path: '**', redirectTo: '' },
];