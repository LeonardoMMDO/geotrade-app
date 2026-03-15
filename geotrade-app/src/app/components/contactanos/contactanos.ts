import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contactanos',
  standalone: true, // Asegúrate de que tenga esto
  imports: [RouterLink], // <-- AGREGA ESTO AQUÍ
  templateUrl: './contactanos.html',
  styleUrl: './contactanos.css',
})
export class Contactanos { // <-- Cámbialo a ContactanosComponent para que coincida con tu app.routes
}