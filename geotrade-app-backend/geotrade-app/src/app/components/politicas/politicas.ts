import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';


@Component({
  selector: 'app-politicas',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './politicas.html',
  styleUrl: './politicas.css'
})
export class PoliticasComponent {
  constructor(private location: Location) {}

  regresar() {
    this.location.back();
  }
}