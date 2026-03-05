import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink], // Para que funcione el botón de "¡Comenzar!"
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class InicioComponent { } // Verifica que diga exactamente así
