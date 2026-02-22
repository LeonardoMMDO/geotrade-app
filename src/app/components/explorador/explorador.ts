import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-explorador',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './explorador.html',
  styleUrls: ['./explorador.css'],
  encapsulation: ViewEncapsulation.None // <-- IMPORTANTE: Esto evita que Angular rompa tu CSS
})
export class ExploradorComponent implements AfterViewInit {

  ngAfterViewInit() {
    // AQUÍ PEGAMOS TU JS ORIGINAL
    const userNameDisplay = document.getElementById("userNameDisplay");
    const profileBtn = document.getElementById('profileBtn');
    const dropdown = document.getElementById('profileDropdown');
    const categories = document.querySelectorAll('.category-item');
    const btnOpenEdit = document.getElementById('openEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const mapPlaceholder = document.getElementById('google-map-placeholder');
    const editSection = document.getElementById('editProfileSection');

    if (userNameDisplay) userNameDisplay.textContent = "Samuel";

    // Lógica categorías
    categories.forEach(item => {
        item.addEventListener('click', function() {
            categories.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Control Dropdown
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
    }

    // Abrir Edición
    if (btnOpenEdit) {
        btnOpenEdit.addEventListener('click', (e) => {
            e.preventDefault();
            if (mapPlaceholder && editSection) {
                mapPlaceholder.style.display = 'none';
                editSection.style.display = 'flex';
                dropdown?.classList.remove('show');
            }
        });
    }

    // Cancelar Edición
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            if (editSection && mapPlaceholder) {
                editSection.style.display = 'none';
                mapPlaceholder.style.display = 'flex';
            }
        });
    }

    // Cerrar al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (dropdown && ! (event.target as HTMLElement).closest('.user-profile')) {
            dropdown.classList.remove('show');
        }
    });
  }
}