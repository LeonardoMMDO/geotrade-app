import { Component } from '@angular/core';
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
  
  loginData = {
    correo: '',
    pass: ''
  };

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  iniciarSesion(form: any) {
  if (form.valid) {
    this.usuarioService.login(this.loginData).subscribe({
      next: (usuarioRecibido) => {
        if (usuarioRecibido) {
          localStorage.setItem('usuario', JSON.stringify(usuarioRecibido));
          localStorage.setItem('nombreUsuario', usuarioRecibido.nombre);
          localStorage.setItem('correoUsuario', this.loginData.correo);
          localStorage.setItem('telefonoUsuario', usuarioRecibido.telefono || '');
          localStorage.setItem('passwordUsuario', usuarioRecibido.pass || '');

          // Redirige según el rol que venga de la BD
          const rutas: Record<string, string> = {
            'admin':      '/admin',
            'empresario': '/dashboard-empresario',
            'explorador': '/explorador'
          };

          const ruta = rutas[usuarioRecibido.rol] ?? '/explorador';
          this.router.navigate([ruta]);
        }
      },
      error: (err) => {
        alert("¡Datos incorrectos!");
        console.error("Error en login:", err);
      }
    });
  } else {
    alert("Por favor, rellena todos los campos.");
  }
}
}