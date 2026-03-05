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
  
  usuario = { 
    nombre: '', 
    correo: '', 
    telefono: '',
    pass: '',
    rol: ''  
  };


  constructor(private router: Router, private usuarioService: UsuarioService) {}

  abrirConfirmacion() {
    this.mostrarModal = true;
  }

 confirmarRegistro() {
  const rolSeleccionado = this.usuario.rol;
  this.mostrarModal = false;

  // IMPORTANTE: Asegúrate de que los campos coincidan con tu modelo Java
  this.usuarioService.registrarUsuario(this.usuario).subscribe({
    next: (response) => {
      console.log("Registro exitoso:", response);
      // Opcional: Guardar el nombre de una vez para que al redirigir ya esté ahí
      localStorage.setItem('nombreUsuario', this.usuario.nombre);
      this.ejecutarRedireccion(rolSeleccionado);
    },
    error: (err) => {
      console.error("Fallo de conexión:", err);
      alert("No se pudo conectar con el servidor Java.");
    }
  });
}

// Función auxiliar para no repetir código
ejecutarRedireccion(rol: string) {
  if (rol === 'usuario') {
    this.router.navigate(['/explorador']);
  } else if (rol === 'empresario') {
    this.router.navigate(['/dashboard-empresario']);
  } else {
    this.router.navigate(['/login']);
  }
}
}