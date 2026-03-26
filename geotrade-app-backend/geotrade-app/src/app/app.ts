import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // Rutas que no necesitan sesión para quedarse donde están
  private readonly rutasPublicas = [
    '/',
    '/login',
    '/registro',
    '/olvidepassword',
    '/contactanos',
    '/nosotros',
    '/politicas'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const rutaActual = window.location.pathname;
    const esRutaPublica = this.rutasPublicas.some(r => rutaActual === r || rutaActual.startsWith(r));
    const sesionActiva = sessionStorage.getItem('usuario');

    if (sesionActiva) {
      return;
    }

    if (esRutaPublica) {
      return;
    }
    localStorage.clear();
    this.router.navigate(['/']);
  }
}