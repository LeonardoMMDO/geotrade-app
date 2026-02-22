import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio'; // Sin el '.component'
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';

export const routes: Routes = [
  { path: '', component: InicioComponent }, 
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: '**', redirectTo: '' }
];