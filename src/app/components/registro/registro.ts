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
    console.log("Datos capturados:", this.usuario);
    
    // Cerramos el modal
    this.mostrarModal = false;

    // Mensaje de éxito
    alert("¡Registro exitoso! Por favor, inicia sesión con tus credenciales.");

    // LA ÚNICA RUTA POSIBLE: LOGIN
    console.log("Navegando hacia el Login...");
    this.router.navigate(['/login']); 
  }
}