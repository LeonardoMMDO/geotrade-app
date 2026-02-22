import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  mostrarModal = false;
  usuario = { nombre: '', correo: '', telefono: '', rol: 'usuario', pass: '' };

  constructor(private router: Router) {}

  abrirConfirmacion() {
    this.mostrarModal = true;
  }

  confirmarRegistro() {
    // EL SWITCH QUE PIDIÓ EL PROFE
    switch (this.usuario.rol) {
      case 'usuario':
        console.log("Navegando a Explorador...");
        this.router.navigate(['/explorador']); 
        break;
      case 'empresario':
        console.log("Navegando a Dashboard Empresario...");
        this.router.navigate(['/dashboard-empresario']); 
        break;
      default:
        console.log("Rol no identificado");
    }
  }
}