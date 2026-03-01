import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NegocioService } from '../../services/negocio.service';
import { Negocio } from '../../model/negocio';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-dashboard-empresario',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgClass],
  templateUrl: './dashboard-empresario.html',
  styleUrls: ['./dashboard-empresario.css']
})
export class DashboardEmpresarioComponent implements OnInit, AfterViewInit, OnDestroy {
  negocios: Negocio[] = [];
  idUsuarioSamuel = 123;
  nombreDisplay: string = '';
  correoDisplay: string = '';
  telefonoDisplay: string = '';
  passwordDisplay: string = '';
  mostrarPassword: boolean = false;
  mostrarConfirmacion: boolean = false;
  archivoFoto: File | null = null;
  archivoIne: File | null = null;
  archivoFotoEdit: File | null = null;
  archivoIneEdit: File | null = null;
  modoEdicion: boolean = false;
  negocioEnEdicion: Negocio | null = null;
  tempNegocio: Negocio = this.initNegocio();
  private bizClickListener: any;

  constructor(private negocioService: NegocioService, private usuarioService: UsuarioService) {}

  ngOnInit() {
    const sessionData = localStorage.getItem('usuario');
    if (sessionData) {
      const user = JSON.parse(sessionData);
      this.nombreDisplay = user.nombre || user.nombre_usuario || 'Empresario';
      this.correoDisplay = user.correo || localStorage.getItem('correoUsuario') || '';
      this.telefonoDisplay = user.telefono || localStorage.getItem('telefonoUsuario') || '';
    } else {
      this.nombreDisplay = localStorage.getItem('nombreUsuario') || 'Empresario';
      this.correoDisplay = localStorage.getItem('correoUsuario') || '';
      this.telefonoDisplay = localStorage.getItem('telefonoUsuario') || '';
    }
    this.passwordDisplay = localStorage.getItem('passwordUsuario') || '';
    this.cargarNegocios();
  }

  cargarDatosPerfil() {
    this.nombreDisplay = localStorage.getItem('nombreUsuario') || '';
    this.correoDisplay = localStorage.getItem('correoUsuario') || '';
    this.telefonoDisplay = localStorage.getItem('telefonoUsuario') || '';
    this.passwordDisplay = localStorage.getItem('passwordUsuario') || '';
  }

  initNegocio(): Negocio {
    const sessionData = localStorage.getItem('usuario');
    const user = sessionData ? JSON.parse(sessionData) : null;
    const idLogueado = user?.id || user?.id_usuario || this.idUsuarioSamuel;

    return {
      id: null,
      id_usuario: idLogueado,
      nombre_empresa: '',
      categoria_empresa: 'restaurante',
      telefono_empresa: '',
      direccion_empresa: '',
      horario_empresa: '',
      correo_empresa: '',
      descripcion_empresa: '',
      fotos_url_empresa: '',
      ine_url_representante: ''
    };
  }

  onFotoSelected(event: any) { this.archivoFoto = event.target.files[0]; }
  onIneSelected(event: any) { this.archivoIne = event.target.files[0]; }

  cargarNegocios() {
    const sessionData = localStorage.getItem('usuario');
    const user = sessionData ? JSON.parse(sessionData) : null;
    const idABuscar = user?.id || user?.id_usuario || this.idUsuarioSamuel;

    this.negocioService.getNegociosByUsuario(idABuscar).subscribe({
      next: (data) => { this.negocios = data; },
      error: (err) => console.error("Error cargando negocios", err)
    });
  }

  confirmarRegistro() {
    if (!this.tempNegocio.nombre_empresa) {
      alert("El nombre de la empresa es obligatorio");
      return;
    }
    this.mostrarConfirmacion = true;
  }

  guardarFinal() {
    const sessionData = localStorage.getItem('usuario');
    const user = sessionData ? JSON.parse(sessionData) : null;
    this.tempNegocio.id_usuario = user?.id || user?.id_usuario || this.idUsuarioSamuel;

    this.negocioService.registrarNegocio(
      this.tempNegocio,
      this.archivoFoto || undefined,
      this.archivoIne || undefined
    ).subscribe({
      next: () => {
        alert("¡Negocio registrado correctamente!");
        this.tempNegocio = this.initNegocio();
        this.archivoFoto = null;
        this.archivoIne = null;
        this.mostrarConfirmacion = false;
        this.cargarNegocios();
        this.ocultarVistas();
      },
      error: (err) => console.error("Error al registrar:", err)
    });
  }

  ngAfterViewInit() {
    // --- BOTÓN NUEVO NEGOCIO ---
    const btnNew = document.getElementById('btnAddNewBiz');
    btnNew?.addEventListener('click', () => {
      const regForm = document.getElementById('registrationForm');
      const detailsView = document.getElementById('detailsView');
      const editSectionBiz = document.getElementById('editProfileSectionBiz');
      if (detailsView) detailsView.style.display = 'none';
      if (editSectionBiz) editSectionBiz.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
    });

    // --- DROPDOWN PERFIL ---
    const profileBtnBiz = document.getElementById('profileBtnBiz');
    const dropdownBiz = document.getElementById('profileDropdownBiz');

    if (profileBtnBiz && dropdownBiz) {
      profileBtnBiz.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownBiz.classList.toggle('show');
      });
    }

    this.bizClickListener = (event: MouseEvent) => {
      if (dropdownBiz && !(event.target as HTMLElement).closest('.user-profile')) {
        dropdownBiz.classList.remove('show');
      }
    };
    window.addEventListener('click', this.bizClickListener);

    // --- EDITAR PERFIL USUARIO ---
    const btnOpenEditBiz = document.getElementById('openEditBiz');
    const btnCancelEditBiz = document.getElementById('btnCancelEditBiz');
    const btnSaveEditBiz = document.getElementById('btnSaveEditBiz');
    const editSectionBiz = document.getElementById('editProfileSectionBiz');
    const contentArea = document.getElementById('bizContentArea');

    if (btnOpenEditBiz) {
      btnOpenEditBiz.addEventListener('click', (e) => {
        e.preventDefault();
        if (contentArea && editSectionBiz) {
          Array.from(contentArea.children).forEach((child: any) => child.style.display = 'none');
          editSectionBiz.style.display = 'flex';
          dropdownBiz?.classList.remove('show');
        }
        setTimeout(() => { this.cargarDatosPerfil(); }, 0);
      });
    }

    if (btnCancelEditBiz) {
      btnCancelEditBiz.addEventListener('click', () => {
        if (editSectionBiz) editSectionBiz.style.display = 'none';
        const regForm = document.getElementById('registrationForm');
        if (regForm) regForm.style.display = 'block';
      });
    }

    if (btnSaveEditBiz) {
      btnSaveEditBiz.addEventListener('click', () => {
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
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
            localStorage.setItem('nombreUsuario', usuarioActualizado.nombre);
            localStorage.setItem('correoUsuario', usuarioActualizado.correo);
            localStorage.setItem('telefonoUsuario', usuarioActualizado.telefono || '');
            localStorage.setItem('passwordUsuario', usuarioActualizado.pass || '');
            if (editSectionBiz) editSectionBiz.style.display = 'none';
            const regForm = document.getElementById('registrationForm');
            if (regForm) regForm.style.display = 'block';
            alert('¡Perfil actualizado correctamente!');
          },
          error: (err) => {
            console.error('Error al actualizar:', err);
            alert('Error al guardar los cambios.');
          }
        });
      });
    }
  }

  private ocultarVistas() {
    const regForm = document.getElementById('registrationForm');
    const detailsView = document.getElementById('detailsView');
    if (regForm) regForm.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
  }

  mostrarDetallesDinamicos(biz: Negocio) {
    const regForm = document.getElementById('registrationForm');
    const detailsView = document.getElementById('detailsView');
    const editSectionBiz = document.getElementById('editProfileSectionBiz');

    if (regForm) regForm.style.display = 'none';
    if (editSectionBiz) editSectionBiz.style.display = 'none';

    if (detailsView) {
      detailsView.style.display = 'block';

      const imgUrl = biz.fotos_url_empresa
        ? `http://localhost:8080${biz.fotos_url_empresa}`
        : null;

      const categoriaIconos: any = {
        restaurante: 'bi-egg-fried', estetica: 'bi-scissors',
        abarrotes: 'bi-bag', ferreteria: 'bi-tools',
        panaderia: 'bi-award', papeleria: 'bi-pencil'
      };
      const icono = categoriaIconos[biz.categoria_empresa] || 'bi-shop';

      detailsView.innerHTML = `
        <div style="background:linear-gradient(135deg, #2c3e50, #3498db); border-radius:15px 15px 0 0; padding:30px; color:white; display:flex; align-items:center; gap:20px;">
            ${imgUrl
              ? `<img src="${imgUrl}" style="width:90px; height:90px; object-fit:cover; border-radius:50%; border:3px solid rgba(255,255,255,0.4); box-shadow:0 4px 15px rgba(0,0,0,0.2);">`
              : `<div style="width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; border:3px solid rgba(255,255,255,0.3);">
                   <i class="bi ${icono}" style="font-size:2.2rem; color:white;"></i>
                 </div>`
            }
            <div>
                <h2 style="margin:0; font-size:1.8rem; font-weight:800;">${biz.nombre_empresa}</h2>
                <span style="background:rgba(255,255,255,0.2); padding:4px 14px; border-radius:20px; font-size:0.85rem; margin-top:8px; display:inline-block; text-transform:capitalize;">
                    <i class="bi ${icono}"></i> ${biz.categoria_empresa}
                </span>
            </div>
        </div>

        <div style="padding:25px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div style="background:#f8fafc; border-radius:12px; padding:15px; display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; background:#e8f4fd; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="bi bi-geo-alt-fill" style="color:#3498db; font-size:1.1rem;"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.75rem; color:#888; font-weight:600; text-transform:uppercase;">Ubicación</p>
                    <p style="margin:0; font-weight:700; color:#2c3e50;">${biz.direccion_empresa || 'No especificada'}</p>
                </div>
            </div>

            <div style="background:#f8fafc; border-radius:12px; padding:15px; display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; background:#e8f8f0; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="bi bi-telephone-fill" style="color:#27ae60; font-size:1.1rem;"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.75rem; color:#888; font-weight:600; text-transform:uppercase;">Teléfono</p>
                    <p style="margin:0; font-weight:700; color:#2c3e50;">${biz.telefono_empresa || 'No especificado'}</p>
                </div>
            </div>

            <div style="background:#f8fafc; border-radius:12px; padding:15px; display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; background:#fef9e7; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="bi bi-clock-fill" style="color:#f39c12; font-size:1.1rem;"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.75rem; color:#888; font-weight:600; text-transform:uppercase;">Horario</p>
                    <p style="margin:0; font-weight:700; color:#2c3e50;">${biz.horario_empresa || 'No especificado'}</p>
                </div>
            </div>

            <div style="background:#f8fafc; border-radius:12px; padding:15px; display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; background:#fdf0f0; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="bi bi-envelope-fill" style="color:#e74c3c; font-size:1.1rem;"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.75rem; color:#888; font-weight:600; text-transform:uppercase;">Correo</p>
                    <p style="margin:0; font-weight:700; color:#2c3e50; font-size:0.9rem;">${biz.correo_empresa || 'No especificado'}</p>
                </div>
            </div>

            <div style="grid-column:span 2; background:#f8fafc; border-radius:12px; padding:15px; display:flex; align-items:flex-start; gap:12px;">
                <div style="width:40px; height:40px; background:#f0eaff; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="bi bi-chat-text-fill" style="color:#8e44ad; font-size:1.1rem;"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.75rem; color:#888; font-weight:600; text-transform:uppercase;">Descripción</p>
                    <p style="margin:0; font-weight:500; color:#2c3e50;">${biz.descripcion_empresa || 'Sin descripción'}</p>
                </div>
            </div>
        </div>

        <div style="padding:0 25px 25px; display:flex; gap:12px;">
            <button id="btnEditBiz" style="flex:1; padding:13px; background:linear-gradient(135deg, #3498db, #2980b9); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.3s;">
                <i class="bi bi-pencil-square"></i> Editar negocio
            </button>
            <button id="btnDeleteBiz" style="flex:1; padding:13px; background:linear-gradient(135deg, #e74c3c, #c0392b); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.3s;">
                <i class="bi bi-trash3-fill"></i> Eliminar negocio
            </button>
        </div>
      `;

      // --- ELIMINAR ---
      const btnDelete = document.getElementById('btnDeleteBiz');
      if (btnDelete) {
        btnDelete.onclick = () => {
          const idAEliminar = biz.id || (biz as any).id_negocio;
          if (idAEliminar) {
            this.eliminarNegocio(idAEliminar, biz.nombre_empresa);
          } else {
            alert("Error: El negocio no tiene un ID válido.");
          }
        };
      }

      // --- EDITAR NEGOCIO ---
      const btnEdit = document.getElementById('btnEditBiz');
      if (btnEdit) {
        btnEdit.onclick = () => {
          this.archivoFotoEdit = null;
          this.archivoIneEdit = null;

          detailsView.innerHTML = `
            <div style="background:linear-gradient(135deg, #2c3e50, #3498db); border-radius:15px 15px 0 0; padding:25px 30px; color:white;">
                <h2 style="margin:0; font-size:1.5rem;"><i class="bi bi-pencil-square"></i> Editar: ${biz.nombre_empresa}</h2>
            </div>
            <div style="padding:25px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div style="grid-column:span 2;">
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Nombre de la Empresa</label>
                    <input type="text" id="edit_nombre" value="${biz.nombre_empresa || ''}" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem; transition:0.3s;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                </div>
                <div>
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Categoría</label>
                    <select id="edit_categoria" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;">
                        <option value="restaurante" ${biz.categoria_empresa === 'restaurante' ? 'selected' : ''}>Restaurantes</option>
                        <option value="estetica" ${biz.categoria_empresa === 'estetica' ? 'selected' : ''}>Estética</option>
                        <option value="abarrotes" ${biz.categoria_empresa === 'abarrotes' ? 'selected' : ''}>Abarrotes</option>
                        <option value="ferreteria" ${biz.categoria_empresa === 'ferreteria' ? 'selected' : ''}>Ferretería</option>
                        <option value="panaderia" ${biz.categoria_empresa === 'panaderia' ? 'selected' : ''}>Panadería</option>
                        <option value="papeleria" ${biz.categoria_empresa === 'papeleria' ? 'selected' : ''}>Papelería</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Dirección</label>
                    <input type="text" id="edit_direccion" value="${biz.direccion_empresa || ''}" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                </div>
                <div>
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Teléfono</label>
                    <input type="tel" id="edit_telefono" value="${biz.telefono_empresa || ''}" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                </div>
                <div>
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Horario</label>
                    <input type="text" id="edit_horario" value="${biz.horario_empresa || ''}" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                </div>
                <div style="grid-column:span 2;">
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Correo Electrónico</label>
                    <input type="email" id="edit_correo" value="${biz.correo_empresa || ''}" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                </div>
                <div style="grid-column:span 2;">
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Descripción</label>
                    <textarea id="edit_descripcion" rows="3" style="width:100%; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem; resize:vertical;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">${biz.descripcion_empresa || ''}</textarea>
                </div>
                <div style="background:#f8fafc; border-radius:10px; padding:15px;">
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;"><i class="bi bi-images"></i> Nueva foto (opcional)</label>
                    <input type="file" id="edit_foto" accept="image/*" style="width:100%;">
                </div>
                <div style="background:#f8fafc; border-radius:10px; padding:15px;">
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;"><i class="bi bi-card-heading"></i> Nuevo INE (opcional)</label>
                    <input type="file" id="edit_ine" accept="image/*,.pdf" style="width:100%;">
                </div>
            </div>
            <div style="padding:0 25px 25px; display:flex; gap:12px;">
                <button id="btnGuardarEdicion" style="flex:1; padding:13px; background:linear-gradient(135deg, #27ae60, #219a52); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem;">
                    <i class="bi bi-check-lg"></i> Guardar Cambios
                </button>
                <button id="btnCancelarEdicion" style="flex:1; padding:13px; background:#f0f0f0; color:#555; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem;">
                    <i class="bi bi-x-lg"></i> Cancelar
                </button>
            </div>
          `;

          const inputFoto = document.getElementById('edit_foto') as HTMLInputElement;
          if (inputFoto) inputFoto.onchange = (e: any) => { this.archivoFotoEdit = e.target.files[0]; };

          const inputIne = document.getElementById('edit_ine') as HTMLInputElement;
          if (inputIne) inputIne.onchange = (e: any) => { this.archivoIneEdit = e.target.files[0]; };

          const btnCancelar = document.getElementById('btnCancelarEdicion');
          if (btnCancelar) btnCancelar.onclick = () => { this.mostrarDetallesDinamicos(biz); };

          const btnGuardar = document.getElementById('btnGuardarEdicion');
          if (btnGuardar) {
            btnGuardar.onclick = () => {
              const negocioActualizado: Negocio = {
                ...biz,
                nombre_empresa: (document.getElementById('edit_nombre') as HTMLInputElement).value,
                categoria_empresa: (document.getElementById('edit_categoria') as HTMLSelectElement).value,
                direccion_empresa: (document.getElementById('edit_direccion') as HTMLInputElement).value,
                telefono_empresa: (document.getElementById('edit_telefono') as HTMLInputElement).value,
                horario_empresa: (document.getElementById('edit_horario') as HTMLInputElement).value,
                correo_empresa: (document.getElementById('edit_correo') as HTMLInputElement).value,
                descripcion_empresa: (document.getElementById('edit_descripcion') as HTMLTextAreaElement).value,
              };

              const idNegocio = biz.id || (biz as any).id_negocio;

              this.negocioService.actualizarNegocio(
                idNegocio,
                negocioActualizado,
                this.archivoFotoEdit || undefined,
                this.archivoIneEdit || undefined
              ).subscribe({
                next: (actualizado) => {
                  alert('¡Negocio actualizado correctamente!');
                  this.archivoFotoEdit = null;
                  this.archivoIneEdit = null;
                  this.cargarNegocios();
                  this.mostrarDetallesDinamicos(actualizado);
                },
                error: (err) => {
                  console.error('Error al actualizar negocio:', err);
                  alert('Error al guardar los cambios.');
                }
              });
            };
          }
        };
      }
    }
  }

  eliminarNegocio(id: number, nombre: string) {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      this.negocioService.deleteNegocio(id).subscribe({
        next: () => {
          alert("Negocio eliminado correctamente.");
          this.cargarNegocios();
          const detailsView = document.getElementById('detailsView');
          if (detailsView) detailsView.style.display = 'none';
        },
        error: (err) => {
          console.error("Error al eliminar", err);
          alert("Error al eliminar: Revisa la configuración del Backend.");
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.bizClickListener) {
      window.removeEventListener('click', this.bizClickListener);
    }
  }
}