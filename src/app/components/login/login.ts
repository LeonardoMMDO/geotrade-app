import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms'; // Aseguramos la importación de NgForm
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router) {}

  // Definimos explícitamente que la función recibe un parámetro de tipo NgForm
  iniciarSesion(form: NgForm) {
    // Si el formulario no cumple con los 'required', salimos de la función
    // Esto permite que el navegador muestre el globito de "Completa este campo" 🎈
    if (form.invalid) {
      return; 
    }

    // Si los datos son válidos, imprimimos en consola y navegamos
    console.log("Datos válidos:", this.loginData);
    this.router.navigate(['/explorador']); 
  }
}