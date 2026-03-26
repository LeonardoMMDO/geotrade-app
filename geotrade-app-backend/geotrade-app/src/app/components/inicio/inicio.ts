import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class InicioComponent {

  constructor(private router: Router){}

  irContactanos(){

    const root = document.querySelector('app-inicio');

    if(root){
      root.classList.add('seccion-salida');
    }

    setTimeout(() => {
      this.router.navigate(['/contactanos']);
    }, 500);

  }

}