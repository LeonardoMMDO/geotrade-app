import { Component, AfterViewInit, ViewEncapsulation, OnDestroy, OnInit } from '@angular/core';

import { RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NgClass } from '@angular/common';


@Component({

  selector: 'app-explorador',

  standalone: true,

  imports: [RouterLink, FormsModule, NgClass],

  templateUrl: './explorador.html',

  styleUrls: ['./explorador.css'],

  encapsulation: ViewEncapsulation.None

})

export class ExploradorComponent implements OnInit, AfterViewInit, OnDestroy {

  nombreDisplay: string = '';

  correoDisplay: string = '';

  telefonoDisplay: string = '';

  passwordDisplay: string = '';
  mostrarPassword: boolean = false;

constructor(private usuarioService: UsuarioService) {}

  private clickListener: any;



  ngOnInit() {

    this.cargarDatos();

  }



  // Método centralizado para leer del localStorage

  cargarDatos() {

    this.nombreDisplay = localStorage.getItem('nombreUsuario') || '';

    this.correoDisplay = localStorage.getItem('correoUsuario') || '';

    this.telefonoDisplay = localStorage.getItem('telefonoUsuario') || '';

    this.passwordDisplay = localStorage.getItem('passwordUsuario') || '';

  }



  ngAfterViewInit() {

    const profileBtn = document.getElementById('profileBtn');

    const dropdown = document.getElementById('profileDropdown');

    const categories = document.querySelectorAll('.category-item');

    const btnOpenEdit = document.getElementById('openEdit');

    const btnCancelEdit = document.getElementById('btnCancelEdit');

    const btnSaveEdit = document.getElementById('btnSaveEdit');

    const mapPlaceholder = document.getElementById('google-map-placeholder');

    const editSection = document.getElementById('editProfileSection');



    // --- ABRIR EDICIÓN Y RELLENAR CAMPOS ---

    if (btnOpenEdit) {
  btnOpenEdit.addEventListener('click', (e) => {
    e.preventDefault();
    if (mapPlaceholder && editSection) {
      mapPlaceholder.style.display = 'none';
      editSection.style.display = 'flex';
      dropdown?.classList.remove('show');
    }
    setTimeout(() => {
      this.cargarDatos();
    }, 0);
  });
}



    // --- GUARDAR CAMBIOS ---

    if (btnSaveEdit) {
  btnSaveEdit.addEventListener('click', (e) => {
    e.preventDefault();

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');
    const id = usuarioGuardado.id;

    const datosActualizados = {
      nombre: this.nombreDisplay,
      correo: this.correoDisplay,
      telefono: this.telefonoDisplay,
      pass: this.passwordDisplay
    };

    this.usuarioService.actualizarUsuario(id, datosActualizados).subscribe({
      next: (usuarioActualizado) => {
        // Actualizamos el localStorage con los nuevos datos
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        localStorage.setItem('nombreUsuario', usuarioActualizado.nombre);
        localStorage.setItem('correoUsuario', usuarioActualizado.correo);
        localStorage.setItem('telefonoUsuario', usuarioActualizado.telefono || '');
        localStorage.setItem('passwordUsuario', usuarioActualizado.pass || '');

        if (editSection && mapPlaceholder) {
          editSection.style.display = 'none';
          mapPlaceholder.style.display = 'flex';
        }

        alert('¡Perfil actualizado correctamente!');
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        alert('Error al guardar los cambios.');
      }
    });
  });
}



    // --- LÓGICA RESTANTE (Sin cambios) ---

    categories.forEach(item => {

      item.addEventListener('click', () => {

        categories.forEach(c => c.classList.remove('active'));

        item.classList.add('active');

      });

    });



    if (profileBtn && dropdown) {

      profileBtn.addEventListener('click', (e) => {

        e.stopPropagation();

        dropdown.classList.toggle('show');

      });

    }



    if (btnCancelEdit) {

      btnCancelEdit.addEventListener('click', () => {

        if (editSection && mapPlaceholder) {

          editSection.style.display = 'none';

          mapPlaceholder.style.display = 'flex';

        }

      });

    }



    this.clickListener = (event: MouseEvent) => {

      if (dropdown && !(event.target as HTMLElement).closest('.user-profile')) {

        dropdown.classList.remove('show');

      }

    };

    window.addEventListener('click', this.clickListener);

  }



  ngOnDestroy() {

    if (this.clickListener) {

      window.removeEventListener('click', this.clickListener);

    }

  }

}