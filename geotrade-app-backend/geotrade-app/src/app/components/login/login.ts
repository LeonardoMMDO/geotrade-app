import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

  showPassword: boolean = false;
  alertaMensaje: string = '';
  alertaTipo: 'error' | 'success' | 'warning' = 'error';
  mostrarAlerta: boolean = false;

  loginData = {
    correo: '',
    pass: ''
  };

  constructor(private router: Router, private usuarioService: UsuarioService, private cdr: ChangeDetectorRef) { }

  iniciarSesion(form: any) {
    const correo = this.loginData.correo.trim().toLowerCase();
    const pass = this.loginData.pass.trim();

    if (!correo || !pass) {
      this.mostrarNotificacion('Por favor, rellena todos los campos.', 'error');
      return;
    }

    // Acceso directo admin
    if (correo === 'geotradeconoce@gmail.com' && pass === 'geonegocios') {
      const adminLocal = {
        id: -1,
        nombre: 'Administrador GeoTrade',
        correo,
        telefono: '',
        pass,
        rol: 'admin'
      };

      localStorage.setItem('usuario', JSON.stringify(adminLocal));
      localStorage.setItem('nombreUsuario', adminLocal.nombre);
      localStorage.setItem('correoUsuario', correo);
      localStorage.setItem('telefonoUsuario', '');
      localStorage.setItem('passwordUsuario', pass);
      sessionStorage.setItem('usuario', JSON.stringify(adminLocal)); // ← NUEVO

      this.router.navigate(['/admin']);
      return;
    }

    this.usuarioService.login({ correo, pass }).subscribe({
      next: (usuarioRecibido) => {
        if (usuarioRecibido) {
          localStorage.setItem('usuario', JSON.stringify(usuarioRecibido));
          localStorage.setItem('nombreUsuario', usuarioRecibido.nombre);
          localStorage.setItem('correoUsuario', correo);
          localStorage.setItem('telefonoUsuario', usuarioRecibido.telefono || '');
          localStorage.setItem('passwordUsuario', usuarioRecibido.pass || '');
          sessionStorage.setItem('usuario', JSON.stringify(usuarioRecibido)); // ← NUEVO

          const rutas: Record<string, string> = {
            'admin': '/admin',
            'empresario': '/dashboard-empresario',
            'explorador': '/explorador'
          };

          const ruta = rutas[usuarioRecibido.rol] ?? '/explorador';
          this.router.navigate([ruta]);
        }
      },
      error: (err) => {
        console.error("Error en login:", err);
        let mensaje = "Datos incorrectos. Verifica tu correo y contraseña.";

        if (err.status === 401) {
          mensaje = "Datos incorrectos. Verifica tu correo y contraseña.";
        } else if (err.status === 403) {
          mensaje = err.error?.error || "Tu cuenta ha sido desactivada. Contacta al administrador.";
        } else if (err.status === 400) {
          mensaje = err.error?.error || "Por favor completa todos los campos.";
        } else if (err.status === 0) {
          mensaje = "No se pudo conectar al servidor. Verifica que está en línea.";
        }

        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  private mostrarNotificacion(mensaje: string, tipo: 'error' | 'success' | 'warning' = 'error') {
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    this.mostrarAlerta = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.mostrarAlerta = false; }, 4000);
  }
}