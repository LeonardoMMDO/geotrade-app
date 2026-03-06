import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NegocioService } from '../../services/negocio.service';
import { Negocio } from '../../model/negocio';
import { UsuarioService } from '../../services/usuario.service';
import { CATEGORIES, CategoryItem } from '../../model/categories';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { NgZone } from '@angular/core';
import { OpinionService } from '../../services/opinion.service';
import { ChangeDetectorRef } from '@angular/core';
import { SucursalService } from '../../services/sucursal.service';
import { Sucursal } from '../../model/sucursal';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  // para crear negocio
  archivosFotos: File[] = [];
  archivosIne: File[] = [];
  // para editar negocio (nuevos archivos seleccionados)
  archivoFotoEdit: File | null = null;
  archivoIneEdit: File | null = null;

  // categorías compartidas
  categories: CategoryItem[] = CATEGORIES;
  modoEdicion: boolean = false;
  negocioEnEdicion: Negocio | null = null;
  tempNegocio: Negocio = this.initNegocio();
  private bizClickListener: any;

  // Location picker
  mostrarSelectorUbicacion: boolean = false;
  private miniMapaEmpresario: google.maps.Map | null = null;
  private marcadorEmpresario: google.maps.Marker | null = null;
  private autocompleteEmpresario: google.maps.places.Autocomplete | null = null;
  private modoEdicionUbicacion: boolean = false;
  private negocioEnEdicionTemp: Negocio | null = null;
  modoSucursalUbicacion: boolean = false;
  private negocioSucursalTemp: Negocio | null = null;
  sucursalDraft: { latitud: number; longitud: number; direccion: string } | null = null;
  sucursalesPorNegocio: { [idNegocio: number]: Sucursal[] } = {};
  sucursalSeleccionadaPorNegocio: { [idNegocio: number]: number | null } = {};
  mostrarToastConfirmSucursal: boolean = false;

  mostrarOpinionesContexto: boolean = false;
  cargandoOpinionesContexto: boolean = false;
  tituloOpinionesContexto: string = '';
  opinionesContexto: any[] = [];
  totalOpinionesContexto: number = 0;
  promedioOpinionesContexto: number = 0;

  // Métricas para empresario
  mostrarMetricasNegocio: boolean = false;
  metricasNegocioActual: Negocio | null = null;
  tituloMetricasContexto: string = '';
  opinionesNegocioActual: any[] = [];
  promedioCalificacionNegocio: number = 0;
  totalOpinionesNegocio: number = 0;
  cargandoMetricas: boolean = false;

  constructor(
    private negocioService: NegocioService,
    private usuarioService: UsuarioService,
    private mapsLoader: GoogleMapsLoaderService,
    private opinionService: OpinionService,
    private sucursalService: SucursalService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

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
      categoria_empresa: 'restaurantes',
      telefono_empresa: '',
      direccion_empresa: '',
      horario_empresa: '',
      correo_empresa: '',
      descripcion_empresa: '',
      fotos_url_empresa: '',
      ine_url_representante: ''
    };
  }



  onFotoSelected(event: any) {
    const files: FileList = event.target.files;
    this.archivosFotos = [];
    const preview = document.getElementById('previewContainer');
    if (preview) preview.innerHTML = '';
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      this.archivosFotos.push(f);
      // mostrar miniatura
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (preview) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '80px';
          img.style.height = '80px';
          img.style.objectFit = 'cover';
          img.style.margin = '4px';
          preview.appendChild(img);
        }
      };
      reader.readAsDataURL(f);
    }
  }

  onIneSelected(event: any) {
    const files: FileList = event.target.files;
    this.archivosIne = [];
    const preview = document.getElementById('inePreviewContainer');
    if (preview) preview.innerHTML = '';
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      this.archivosIne.push(f);
      // mostrar miniatura o icono
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (preview) {
          const container = document.createElement('div');
          container.style.display = 'inline-flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '8px';
          
          if (f.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '80px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            container.appendChild(img);
          } else {
            // Para PDFs u otros archivos
            const icon = document.createElement('div');
            icon.innerHTML = '<i class="bi bi-file-pdf" style="font-size: 2rem; color: #e74c3c;"></i>';
            icon.style.width = '80px';
            icon.style.height = '100px';
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.backgroundColor = '#f5f5f5';
            icon.style.borderRadius = '4px';
            container.appendChild(icon);
          }
          
          const label = document.createElement('p');
          label.textContent = f.name;
          label.style.fontSize = '0.75rem';
          label.style.marginTop = '4px';
          label.style.maxWidth = '80px';
          label.style.overflow = 'hidden';
          label.style.textOverflow = 'ellipsis';
          label.style.whiteSpace = 'nowrap';
          label.style.color = '#666';
          container.appendChild(label);
          
          preview.appendChild(container);
        }
      };
      reader.readAsDataURL(f);
    }
  }

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

  async guardarFinal() {
    const sessionData = localStorage.getItem('usuario');
    const user = sessionData ? JSON.parse(sessionData) : null;
    this.tempNegocio.id_usuario = user?.id || user?.id_usuario || this.idUsuarioSamuel;

    // Try to geocode the provided address (best-effort). If it fails, continue without coords.
    try {
      const direccion = this.tempNegocio.direccion_empresa || '';
      if (direccion.trim()) {
        const coords = await this.geocodeAddress(direccion);
        if (coords) {
          this.tempNegocio.latitud = coords.lat;
          this.tempNegocio.longitud = coords.lng;
        }
      }
    } catch (e) {
      console.warn('Geocoding failed, continuing without coords', e);
    }

    this.negocioService.registrarNegocio(
      this.tempNegocio,
      undefined,
      this.archivosFotos,
      this.archivosIne
    ).subscribe({
      next: () => {
        alert("¡Negocio registrado correctamente!");
        this.tempNegocio = this.initNegocio();
        this.archivosFotos = [];
        this.archivosIne = [];
        this.mostrarConfirmacion = false;
        this.cargarNegocios();
        this.ocultarVistas();
      },
      error: (err) => console.error("Error al registrar:", err)
    });
  }

  private geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      this.mapsLoader.load().then(() => {
        try {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address }, (results, status) => {
            // run inside Angular zone to avoid change-detection issues
            this.ngZone.run(() => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
              } else {
                console.warn('Geocode no results/status:', status);
                resolve(null);
              }
            });
          });
        } catch (e) {
          console.warn('Geocode exception', e);
          resolve(null);
        }
      }).catch(err => {
        console.warn('Maps loader failed for geocoding', err);
        resolve(null);
      });
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

  private normalizeCategoria(value: string | null | undefined): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  getCategoriaIconClass(categoria: string | null | undefined): string {
    const normalized = this.normalizeCategoria(categoria);
    const iconMap: { [key: string]: string } = {
      restaurante: 'bi bi-fork-knife',
      restaurantes: 'bi bi-fork-knife',
      refaccionaria: 'bi bi-car-front-fill',
      refaccionarias: 'bi bi-car-front-fill',
      estetica: 'bi bi-scissors',
      abarrotes: 'bi bi-cart',
      farmacia: 'bi bi-capsule',
      farmacias: 'bi bi-capsule',
      gym: 'bi bi-heart-pulse',
      floreria: 'bi bi-flower3',
      boutique: 'bi bi-handbag',
      papeleria: 'bi bi-book',
      papelerias: 'bi bi-book',
      veterinaria: 'bi bi-hospital',
      veterinarias: 'bi bi-hospital'
    };
    return iconMap[normalized] || 'bi bi-shop';
  }

  mostrarDetallesDinamicos(biz: Negocio) {
    const regForm = document.getElementById('registrationForm');
    const detailsView = document.getElementById('detailsView');
    const editSectionBiz = document.getElementById('editProfileSectionBiz');

    if (regForm) regForm.style.display = 'none';
    if (editSectionBiz) editSectionBiz.style.display = 'none';

    const idNegocio = (biz.id || (biz as any).id_negocio) as number;
    if (idNegocio && !this.sucursalesPorNegocio[idNegocio]) {
      this.sucursalService.getSucursalesByNegocio(idNegocio).subscribe({
        next: (rows) => {
          this.sucursalesPorNegocio[idNegocio] = rows || [];
          this.mostrarDetallesDinamicos(biz);
        },
        error: () => {
          this.sucursalesPorNegocio[idNegocio] = [];
          this.mostrarDetallesDinamicos(biz);
        }
      });
      return;
    }

    if (detailsView) {
      detailsView.style.display = 'block';

      let imgUrl: string | null = null;
      if (biz.fotos_url_empresa) {
        // puede ser varias URLs separadas por coma
        const parts = biz.fotos_url_empresa.split(',');
        imgUrl = `http://localhost:8080${parts[0]}`; // mostrar primera como icono
      }

      const icono = this.getCategoriaIconClass(biz.categoria_empresa);
      const idNegocioActual = (biz.id || (biz as any).id_negocio) as number;
      const contexto = this.obtenerContextoDetalle(biz, idNegocioActual);
      const selectorSucursalesHtml = this.renderSelectorSucursalesHtml(idNegocioActual);

      detailsView.innerHTML = `
        <div style="background:linear-gradient(135deg, #2c3e50, #3498db); border-radius:15px 15px 0 0; padding:30px; color:white; display:flex; align-items:center; gap:20px;">
            ${imgUrl
              ? `<img src="${imgUrl}" style="width:90px; height:90px; object-fit:cover; border-radius:50%; border:3px solid rgba(255,255,255,0.4); box-shadow:0 4px 15px rgba(0,0,0,0.2);">`
              : `<div style="width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; border:3px solid rgba(255,255,255,0.3);">
                     <i class="${icono}" style="font-size:2.2rem; color:white;"></i>
                 </div>`
            }
            <div>
                <h2 style="margin:0; font-size:1.8rem; font-weight:800;">${biz.nombre_empresa}</h2>
                <span style="background:rgba(255,255,255,0.2); padding:4px 14px; border-radius:20px; font-size:0.85rem; margin-top:8px; display:inline-block; text-transform:capitalize;">
                    <i class="${icono}"></i> ${biz.categoria_empresa}
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
                  <p style="margin:0; font-weight:700; color:#2c3e50;">${contexto.direccion || 'No especificada'}</p>
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

        ${selectorSucursalesHtml}

        <div style="padding:0 25px 25px; display:flex; gap:12px;">
            <button id="btnEditBiz" style="flex:1; padding:13px; background:linear-gradient(135deg, #3498db, #2980b9); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.3s;">
                <i class="bi bi-pencil-square"></i> Editar negocio
            </button>
            <button id="btnAgregarSucursalBiz" style="flex:1; padding:13px; background:linear-gradient(135deg, #8e44ad, #6c3483); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.3s;">
                <i class="bi bi-geo-alt-fill"></i> Agregar sucursales
            </button>
          <button id="btnMetricasBiz" style="flex:1; padding:13px; background:linear-gradient(135deg, #16a085, #117a65); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.3s;">
            <i class="bi bi-bar-chart-line-fill"></i> Métricas
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

      const btnMetricas = document.getElementById('btnMetricasBiz');
      if (btnMetricas) {
        btnMetricas.onclick = () => {
          this.ngZone.run(() => this.abrirMetricasNegocio(biz, idNegocioActual));
        };
      }

      const btnAgregarSucursal = document.getElementById('btnAgregarSucursalBiz');
      if (btnAgregarSucursal) {
        btnAgregarSucursal.onclick = () => {
          this.ngZone.run(() => {
            this.modoSucursalUbicacion = true;
            this.negocioSucursalTemp = biz;
            this.sucursalDraft = null;
            this.abrirSelectorUbicacion();
          });
        };
      }

      const switches = detailsView.querySelectorAll('[data-sucursal-switch]');
      switches.forEach((el) => {
        (el as HTMLElement).onclick = () => {
          const marker = (el as HTMLElement).getAttribute('data-sucursal-switch');
          if (marker === 'principal') {
            this.sucursalSeleccionadaPorNegocio[idNegocioActual] = null;
          } else {
            this.sucursalSeleccionadaPorNegocio[idNegocioActual] = Number(marker);
          }
          this.mostrarDetallesDinamicos(biz);
        };
      });

      // --- EDITAR NEGOCIO ---
      const btnEdit = document.getElementById('btnEditBiz');
      if (btnEdit) {
        btnEdit.onclick = () => {
          this.archivoFotoEdit = null;
          this.archivoIneEdit = null;
          this.modoEdicionUbicacion = false;
          this.negocioEnEdicionTemp = null;

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
                    <option value="restaurantes" ${this.normalizeCategoria(biz.categoria_empresa) === 'restaurantes' || this.normalizeCategoria(biz.categoria_empresa) === 'restaurante' ? 'selected' : ''}>Restaurantes</option>
                    <option value="refaccionarias" ${this.normalizeCategoria(biz.categoria_empresa) === 'refaccionarias' || this.normalizeCategoria(biz.categoria_empresa) === 'refaccionaria' ? 'selected' : ''}>Refaccionarias</option>
                    <option value="estética" ${this.normalizeCategoria(biz.categoria_empresa) === 'estetica' ? 'selected' : ''}>Estética</option>
                        <option value="abarrotes" ${biz.categoria_empresa === 'abarrotes' ? 'selected' : ''}>Abarrotes</option>
                    <option value="farmacias" ${this.normalizeCategoria(biz.categoria_empresa) === 'farmacias' || this.normalizeCategoria(biz.categoria_empresa) === 'farmacia' || this.normalizeCategoria(biz.categoria_empresa) === 'consultorios' ? 'selected' : ''}>Farmacias</option>
                    <option value="gym" ${this.normalizeCategoria(biz.categoria_empresa) === 'gym' || this.normalizeCategoria(biz.categoria_empresa) === 'servicios a domicilio' ? 'selected' : ''}>Gym</option>
                    <option value="floreria" ${this.normalizeCategoria(biz.categoria_empresa) === 'floreria' || this.normalizeCategoria(biz.categoria_empresa) === 'escuelas' ? 'selected' : ''}>Florería</option>
                    <option value="boutique" ${this.normalizeCategoria(biz.categoria_empresa) === 'boutique' || this.normalizeCategoria(biz.categoria_empresa) === 'hospedajes' ? 'selected' : ''}>Boutique</option>
                    <option value="papelerías" ${this.normalizeCategoria(biz.categoria_empresa) === 'papelerias' || this.normalizeCategoria(biz.categoria_empresa) === 'papeleria' ? 'selected' : ''}>Papelerías</option>
                    <option value="veterinarias" ${this.normalizeCategoria(biz.categoria_empresa) === 'veterinarias' || this.normalizeCategoria(biz.categoria_empresa) === 'veterinaria' ? 'selected' : ''}>Veterinarias</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700; color:#2c3e50; display:block; margin-bottom:8px; font-size:0.85rem; text-transform:uppercase;">Dirección</label>
                    <div style="display:flex; gap:8px;">
                      <input type="text" id="edit_direccion" value="${biz.direccion_empresa || ''}" style="flex:1; padding:12px 15px; border:2px solid #eee; border-radius:10px; outline:none; font-size:1rem;" onfocus="this.style.borderColor='#3498db'" onblur="this.style.borderColor='#eee'">
                      <button type="button" id="btnMapaEditar" style="padding:12px 20px; background:linear-gradient(135deg, #3498db, #2980b9); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; white-space:nowrap; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                        <i class="bi bi-geo-alt-fill"></i> Mapa
                      </button>
                    </div>
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
          // note: for now editing still allows single replacement; multi edit could be added similarly

          const inputIne = document.getElementById('edit_ine') as HTMLInputElement;
          if (inputIne) inputIne.onchange = (e: any) => { this.archivoIneEdit = e.target.files[0]; };

          // Botón para abrir mapa en edición
          const btnMapaEditar = document.getElementById('btnMapaEditar');
          if (btnMapaEditar) {
            btnMapaEditar.onclick = () => {
              this.ngZone.run(() => {
                this.modoEdicionUbicacion = true;
                this.negocioEnEdicionTemp = biz;
                this.abrirSelectorUbicacion();
              });
            };
          }

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
                latitud: biz.latitud,
                longitud: biz.longitud,
              };

              const idNegocio = biz.id || (biz as any).id_negocio;

              this.negocioService.actualizarNegocio(
                idNegocio,
                negocioActualizado,
                undefined,
                this.archivoFotoEdit ? [this.archivoFotoEdit] : undefined,
                this.archivoIneEdit ? [this.archivoIneEdit] : undefined
              ).subscribe({
                next: (actualizado) => {
                  alert('¡Negocio actualizado correctamente!');
                  this.archivoFotoEdit = null;
                  this.archivoIneEdit = null;
                  this.negocioEnEdicionTemp = null;
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

  // ============ LOCATION PICKER LOGIC ============
  abrirSelectorUbicacion() {
    this.ngZone.run(() => {
      this.mostrarSelectorUbicacion = true;
      // Fuerza render inmediato del modal cuando el click viene de HTML dinámico.
      this.cdr.detectChanges();
      // Esperar a que el modal exista en DOM y luego dibujar el mapa
      this.mapsLoader.load().then(() => {
        setTimeout(() => this.inicializarMiniMapa(), 220);
      });
    });
  }

  cerrarSelectorUbicacion() {
    this.mostrarSelectorUbicacion = false;
    this.modoSucursalUbicacion = false;
    this.mostrarToastConfirmSucursal = false;
  }

  confirmarUbicacion() {
    if (this.modoSucursalUbicacion) {
      if (!this.sucursalDraft?.latitud || !this.sucursalDraft?.longitud) {
        alert('Selecciona una ubicación para la sucursal.');
        return;
      }
      this.mostrarToastConfirmSucursal = true;
      return;
    }

    // Dirección y coordenadas ya quedaron en negocio principal
    this.modoEdicionUbicacion = false;
    this.negocioEnEdicionTemp = null;
    this.cerrarSelectorUbicacion();
  }

  confirmarGuardarSucursal() {
    if (!this.negocioSucursalTemp || !this.sucursalDraft) {
      this.cancelarGuardarSucursal();
      return;
    }

    const idNegocio = (this.negocioSucursalTemp.id || (this.negocioSucursalTemp as any).id_negocio) as number;
    if (!idNegocio) {
      this.cancelarGuardarSucursal();
      return;
    }

    const payload: Sucursal = {
      idNegocio,
      latitud: this.sucursalDraft.latitud,
      longitud: this.sucursalDraft.longitud,
      direccion: this.sucursalDraft.direccion
    };

    this.sucursalService.crearSucursal(payload).subscribe({
      next: () => {
        this.mostrarToastConfirmSucursal = false;
        this.modoSucursalUbicacion = false;
        this.cerrarSelectorUbicacion();
        this.cargarSucursalesNegocio(idNegocio, this.negocioSucursalTemp!);
      },
      error: (err) => {
        console.error('Error al guardar sucursal', err);
        alert('No se pudo guardar la sucursal.');
      }
    });
  }

  cancelarGuardarSucursal() {
    this.mostrarToastConfirmSucursal = false;
    this.modoSucursalUbicacion = false;
    this.negocioSucursalTemp = null;
    this.sucursalDraft = null;
    this.cerrarSelectorUbicacion();
  }

  inicializarMiniMapa() {
    const mapElement = document.getElementById('miniMapaEmpresario');
    if (!mapElement) return;

    const latActual = this.modoEdicionUbicacion
      ? this.negocioEnEdicionTemp?.latitud
      : this.tempNegocio.latitud;
    const lngActual = this.modoEdicionUbicacion
      ? this.negocioEnEdicionTemp?.longitud
      : this.tempNegocio.longitud;

    // Si ya hay coordenadas guardadas, priorizarlas.
    if (typeof latActual === 'number' && typeof lngActual === 'number') {
      this.ngZone.run(() => this.crearMiniMapa(latActual, lngActual));
      return;
    }

    // Intentar obtener ubicación actual del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          this.ngZone.run(() => this.crearMiniMapa(userLat, userLng));
        },
        () => {
          // Si no tiene permisos, usar default (México City)
          console.warn('Ubicación no disponible, usando default');
          this.ngZone.run(() => this.crearMiniMapa(20.6296, -87.0739));
        }
      );
    } else {
      // Si no soporta geolocation, usar default
      this.ngZone.run(() => this.crearMiniMapa(20.6296, -87.0739));
    }
  }

  private crearMiniMapa(lat: number, lng: number) {
    try {
      const coords = new google.maps.LatLng(lat, lng);
      const mapElement = document.getElementById('miniMapaEmpresario');
      if (!mapElement) {
        console.error('Elemento miniMapaEmpresario no encontrado');
        return;
      }

      const mapOptions: google.maps.MapOptions = {
        center: coords,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false
      };

      if (this.autocompleteEmpresario) {
        google.maps.event.clearInstanceListeners(this.autocompleteEmpresario);
      }

      this.miniMapaEmpresario = new google.maps.Map(mapElement, mapOptions);

      setTimeout(() => {
        if (this.miniMapaEmpresario) {
          google.maps.event.trigger(this.miniMapaEmpresario, 'resize');
          this.miniMapaEmpresario.setCenter(coords);
        }
      }, 100);

      // Crear marcador
      this.marcadorEmpresario = new google.maps.Marker({
        position: coords,
        map: this.miniMapaEmpresario,
        draggable: true,
        title: 'Tu negocio aquí'
      });

      // Evento: al mover el marcador, actualizar coords
      this.marcadorEmpresario.addListener('dragend', () => {
        const pos = this.marcadorEmpresario?.getPosition();
        if (pos) {
          this.actualizarCoords(pos.lat(), pos.lng());
        }
      });

      // Evento: click en el mapa coloca marcador
      this.miniMapaEmpresario.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          this.marcadorEmpresario?.setPosition(e.latLng);
          this.actualizarCoords(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Configurar Autocomplete
      const searchBox = document.getElementById('searchBoxEmpresario') as HTMLInputElement;
      if (searchBox) {
        this.autocompleteEmpresario = new google.maps.places.Autocomplete(searchBox, {
          componentRestrictions: { country: 'mx' }, // Limitar a México (opcional)
          fields: ['formatted_address', 'geometry', 'name']
        });

        this.autocompleteEmpresario.bindTo('bounds', this.miniMapaEmpresario);

        this.autocompleteEmpresario.addListener('place_changed', () => {
          const place = this.autocompleteEmpresario?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            const location = place.geometry.location;
            // Centrar mapa
            this.miniMapaEmpresario?.setCenter(location);
            this.miniMapaEmpresario?.setZoom(18);

            // Mover marcador
            this.marcadorEmpresario?.setPosition(location);

            // Actualizar coords y dirección
            this.ngZone.run(() => {
              const direccion = place.formatted_address || '';
              if (this.modoEdicionUbicacion) {
                const editDireccion = document.getElementById('edit_direccion') as HTMLInputElement;
                if (editDireccion) {
                  editDireccion.value = direccion;
                }
                if (this.negocioEnEdicionTemp) {
                  this.negocioEnEdicionTemp.direccion_empresa = direccion;
                }
              } else {
                this.tempNegocio.direccion_empresa = direccion;
              }
              this.actualizarCoords(location.lat(), location.lng());
            });
          }
        });

        // Focus automático en el input
        searchBox.focus();
      }
    } catch (error) {
      console.error('Error al crear mini mapa:', error);
    }
  }

  actualizarCoords(lat: number, lng: number) {
    if (this.modoSucursalUbicacion) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        this.ngZone.run(() => {
          this.sucursalDraft = {
            latitud: lat,
            longitud: lng,
            direccion: status === 'OK' && results && results[0] ? results[0].formatted_address : ''
          };
        });
      });
      return;
    }

    // Actualizar ubicación según modo
    if (this.modoEdicionUbicacion && this.negocioEnEdicionTemp) {
      this.negocioEnEdicionTemp.latitud = lat;
      this.negocioEnEdicionTemp.longitud = lng;
    } else {
      this.tempNegocio.latitud = lat;
      this.tempNegocio.longitud = lng;
    }
    
    // Obtener dirección usando Geocoder
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        this.ngZone.run(() => {
          const direccion = results[0].formatted_address;
          
          if (this.modoEdicionUbicacion) {
            // Actualizar campo en la edición
            const editDireccion = document.getElementById('edit_direccion') as HTMLInputElement;
            if (editDireccion) {
              editDireccion.value = direccion;
            }
            if (this.negocioEnEdicionTemp) {
              this.negocioEnEdicionTemp.direccion_empresa = direccion;
            }
          } else {
            // Actualizar en modo creación
            this.tempNegocio.direccion_empresa = direccion;
          }
        });
      }
    });
  }

  private cargarSucursalesNegocio(idNegocio: number, biz: Negocio) {
    this.sucursalService.getSucursalesByNegocio(idNegocio).subscribe({
      next: (rows) => {
        this.sucursalesPorNegocio[idNegocio] = rows || [];
        this.mostrarDetallesDinamicos(biz);
      },
      error: () => {
        this.sucursalesPorNegocio[idNegocio] = [];
        this.mostrarDetallesDinamicos(biz);
      }
    });
  }

  private obtenerContextoDetalle(biz: Negocio, idNegocio: number): {
    esPrincipal: boolean;
    idSucursal: number | null;
    direccion: string;
    latitud: number | undefined;
    longitud: number | undefined;
    etiqueta: string;
  } {
    const selectedId = this.sucursalSeleccionadaPorNegocio[idNegocio] ?? null;
    const sucursales = this.sucursalesPorNegocio[idNegocio] || [];
    if (selectedId != null) {
      const idx = sucursales.findIndex((s) => s.idSucursal === selectedId);
      if (idx >= 0) {
        const s = sucursales[idx];
        return {
          esPrincipal: false,
          idSucursal: s.idSucursal || null,
          direccion: s.direccion || biz.direccion_empresa,
          latitud: s.latitud,
          longitud: s.longitud,
          etiqueta: `Sucursal ${idx + 1}`
        };
      }
      this.sucursalSeleccionadaPorNegocio[idNegocio] = null;
    }

    return {
      esPrincipal: true,
      idSucursal: null,
      direccion: biz.direccion_empresa,
      latitud: biz.latitud,
      longitud: biz.longitud,
      etiqueta: 'Principal'
    };
  }

  private renderSelectorSucursalesHtml(idNegocio: number): string {
    const sucursales = this.sucursalesPorNegocio[idNegocio] || [];
    const selectedId = this.sucursalSeleccionadaPorNegocio[idNegocio] ?? null;

    const principalClass = selectedId == null
      ? 'background:#1d4ed8;color:#fff;border:1px solid #1d4ed8;'
      : 'background:#f8fafc;color:#334155;border:1px solid #dbeafe;';

    const sucursalesButtons = sucursales.map((s, i) => {
      const isActive = selectedId === s.idSucursal;
      const style = isActive
        ? 'background:#0ea5e9;color:#fff;border:1px solid #0284c7;'
        : 'background:#f8fafc;color:#334155;border:1px solid #dbeafe;';
      return `<button type="button" data-sucursal-switch="${s.idSucursal}" style="padding:8px 12px;border-radius:999px;cursor:pointer;font-weight:700;${style}">Sucursal ${i + 1}</button>`;
    }).join('');

    return `
      <div style="padding:0 25px 16px; display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
        <button type="button" data-sucursal-switch="principal" style="padding:8px 12px;border-radius:999px;cursor:pointer;font-weight:700;${principalClass}">Principal</button>
        ${sucursalesButtons}
      </div>
    `;
  }

  abrirOpinionesContexto(biz: Negocio, idNegocio: number) {
    const contexto = this.obtenerContextoDetalle(biz, idNegocio);
    this.mostrarOpinionesContexto = true;
    this.cargandoOpinionesContexto = true;
    this.opinionesContexto = [];
    this.totalOpinionesContexto = 0;
    this.promedioOpinionesContexto = 0;

    const keys = contexto.esPrincipal
      ? [`negocio:${idNegocio}`, String(idNegocio)]
      : [`sucursal:${contexto.idSucursal}`];

    this.tituloOpinionesContexto = contexto.esPrincipal
      ? `Opiniones - Principal (${biz.nombre_empresa})`
      : `Opiniones - ${contexto.etiqueta} (${biz.nombre_empresa})`;

    forkJoin(keys.map((k) => this.opinionService.getOpinions(k).pipe(catchError(() => of([]))))).subscribe({
      next: (groups) => {
        const opiniones = (groups || []).flat();
        const dedup = new Map<string, any>();
        opiniones.forEach((item: any) => {
          const key = String(item.id ?? '') + '|' + String(item.usuarioId ?? '') + '|' + String(item.texto ?? '');
          if (!dedup.has(key)) dedup.set(key, item);
        });
        this.opinionesContexto = Array.from(dedup.values()).sort((a, b) => {
          const fa = new Date(a.fechaCreacion || 0).getTime();
          const fb = new Date(b.fechaCreacion || 0).getTime();
          return fb - fa;
        });

        this.totalOpinionesContexto = this.opinionesContexto.length;
        if (this.totalOpinionesContexto > 0) {
          const suma = this.opinionesContexto.reduce((acc, item) => acc + (Number(item.calificacion) || 0), 0);
          this.promedioOpinionesContexto = suma / this.totalOpinionesContexto;
        }
        this.cargandoOpinionesContexto = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoOpinionesContexto = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarOpinionesContexto() {
    this.mostrarOpinionesContexto = false;
  }

  abrirMetricasNegocio(biz: Negocio, idNegocio: number) {
    const contexto = this.obtenerContextoDetalle(biz, idNegocio);
    this.metricasNegocioActual = biz;
    this.tituloMetricasContexto = contexto.esPrincipal
      ? `Métricas de ${biz.nombre_empresa} (Principal)`
      : `Métricas de ${biz.nombre_empresa} - ${contexto.etiqueta}`;
    this.mostrarMetricasNegocio = true;
    this.cargandoMetricas = true;
    this.cdr.detectChanges();
    this.opinionesNegocioActual = [];
    this.promedioCalificacionNegocio = 0;
    this.totalOpinionesNegocio = 0;

    const keys = contexto.esPrincipal
      ? [`negocio:${idNegocio}`, String(idNegocio)]
      : [`sucursal:${contexto.idSucursal}`];

    forkJoin(
      keys.map((k) => this.opinionService.getOpinions(k).pipe(catchError(() => of([]))))
    ).subscribe({
      next: (groups) => {
        const opiniones = (groups || []).flat();
        const dedup = new Map<string, any>();
        opiniones.forEach((item: any) => {
          const key = String(item.id ?? '') + '|' + String(item.usuarioId ?? '') + '|' + String(item.texto ?? '');
          if (!dedup.has(key)) dedup.set(key, item);
        });

        this.opinionesNegocioActual = Array.from(dedup.values()).slice().sort((a, b) => {
          const fa = new Date(a.fechaCreacion || 0).getTime();
          const fb = new Date(b.fechaCreacion || 0).getTime();
          return fb - fa;
        });

        this.totalOpinionesNegocio = this.opinionesNegocioActual.length;
        if (this.totalOpinionesNegocio > 0) {
          const suma = this.opinionesNegocioActual.reduce((acc, item) => acc + (Number(item.calificacion) || 0), 0);
          this.promedioCalificacionNegocio = suma / this.totalOpinionesNegocio;
        }
        this.cargandoMetricas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('No se pudieron cargar las opiniones del negocio', err);
        this.cargandoMetricas = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarMetricasNegocio() {
    this.mostrarMetricasNegocio = false;
    this.metricasNegocioActual = null;
    this.tituloMetricasContexto = '';
  }

  formatearFechaOpinion(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const fecha = new Date(value);
    if (isNaN(fecha.getTime())) return 'Sin fecha';
    return fecha.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy() {
    if (this.bizClickListener) {
      window.removeEventListener('click', this.bizClickListener);
    }
  }
}