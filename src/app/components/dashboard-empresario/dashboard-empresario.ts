import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-empresario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-empresario.html',
  styleUrls: ['./dashboard-empresario.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardEmpresarioComponent implements AfterViewInit {

  ngAfterViewInit() {
    const btnNew = document.getElementById('btnAddNewBiz');
    const regForm = document.getElementById('registrationForm');
    const detailsView = document.getElementById('detailsView');
    const bizItems = document.querySelectorAll('.biz-item');
    const photoInput = document.getElementById('bizPhotos') as HTMLInputElement;
    const previewContainer = document.getElementById('previewContainer');

    // 1. Lógica para previsualizar fotos
    if (photoInput && previewContainer) {
      photoInput.addEventListener('change', function() {
        previewContainer.innerHTML = ''; 
        const files = Array.from(this.files || []);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target?.result as string;
            img.classList.add('preview-img');
            previewContainer.appendChild(img);
          }
          reader.readAsDataURL(file);
        });
      });
    }

    // 2. Mostrar formulario de registro nuevo
    btnNew?.addEventListener('click', () => {
      if (detailsView && regForm) {
        detailsView.style.display = 'none';
        regForm.style.display = 'block';
        bizItems.forEach(i => i.classList.remove('active'));
        (document.getElementById('formRegisterBiz') as HTMLFormElement).reset();
        if (previewContainer) previewContainer.innerHTML = '';
      }
    });

    // 3. Ver detalles de un negocio existente
    bizItems.forEach(item => {
      item.addEventListener('click', function(this: HTMLElement) {
        bizItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        const bizNameValue = this.querySelector('.biz-name')?.textContent;

        if (regForm && detailsView) {
          regForm.style.display = 'none';
          detailsView.style.display = 'block';

          detailsView.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px;">
                <h2><i class="bi bi-shop"></i> ${bizNameValue}</h2>
                <button id="closeDetails" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Cerrar</button>
            </div>
            <div class="grid-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <p><strong>Ubicación:</strong> Calle Falsa 123, Col. Centro</p>
                <p><strong>Horario:</strong> Lunes a Viernes 09:00 - 18:00</p>
                <p><strong>Categoría:</strong> Restaurante / Comida</p>
                <p><strong>Teléfono:</strong> 55-9876-5432</p>
                <div style="grid-column: span 2;">
                    <p><strong>Descripción:</strong> Negocio dedicado a la venta de alimentos preparados con alta calidad.</p>
                </div>
            </div>
            <button class="btn-save-biz" style="background:#f39c12; margin-top:30px; width: 100%; border:none; color:white; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer;">Editar Información</button>
          `;

          document.getElementById('closeDetails')?.addEventListener('click', () => {
            detailsView.style.display = 'none';
            regForm.style.display = 'block';
            this.classList.remove('active');
          });
        }
      });
    });
  }
}