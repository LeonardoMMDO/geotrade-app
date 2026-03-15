import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  mostrarModal = false;
  mostrarPassword = false;
  aceptaTerminos = false;

  usuario = {
    nombre: '',
    correo: '',
    telefono: '',
    pass: '',
    rol: ''
  };

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }


  constructor(private router: Router, private usuarioService: UsuarioService) { }

  abrirConfirmacion() {
    this.mostrarModal = true;
  }

  confirmarRegistro() {
    this.mostrarModal = false;

    // IMPORTANTE: Asegúrate de que los campos coincidan con tu modelo Java
    this.usuarioService.registrarUsuario(this.usuario).subscribe({
      next: (response) => {
        console.log("Registro exitoso:", response);
        this.limpiarSesionActiva();
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: (err) => {
        console.error("Fallo de conexión:", err);
        alert("No se pudo conectar con el servidor Java.");
      }
    });
  }

  private limpiarSesionActiva() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('correoUsuario');
    localStorage.removeItem('telefonoUsuario');
    localStorage.removeItem('passwordUsuario');
  }
}