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
  correoYaExiste = false;        // ← NUEVO
  verificandoCorreo = false;     // ← NUEVO

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

  // ← NUEVO
  verificarCorreo(): void {
    const correo = this.usuario.correo.trim();
    if (!correo) return;

    this.verificandoCorreo = true;
    this.correoYaExiste = false;

    this.usuarioService.verificarCorreo(correo).subscribe({
      next: (res) => {
        this.correoYaExiste = res.existe;
        this.verificandoCorreo = false;
      },
      error: () => {
        this.verificandoCorreo = false;
      }
    });
  }

  abrirConfirmacion() {
    if (this.correoYaExiste) return;

    // Verificar correo en el momento de abrir la confirmación
    const correo = this.usuario.correo.trim();
    if (!correo) return;

    this.verificandoCorreo = true;

    this.usuarioService.verificarCorreo(correo).subscribe({
      next: (res) => {
        this.verificandoCorreo = false;
        this.correoYaExiste = res.existe;

        if (res.existe) return; // bloquear si ya existe

        this.mostrarModal = true; // solo abre si no existe
      },
      error: () => {
        this.verificandoCorreo = false;
        this.mostrarModal = true; // si falla la verificación, dejar continuar
      }
    });
  }

  confirmarRegistro() {
    this.mostrarModal = false;

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