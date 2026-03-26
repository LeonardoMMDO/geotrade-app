import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { CATEGORIES } from '../../model/categories';
import { Categoria } from '../../model/categoria';
import { Negocio } from '../../model/negocio';
import { Sucursal } from '../../model/sucursal';
import { CategoriaService } from '../../services/categoria.service';
import { NegocioService } from '../../services/negocio.service';
import { OpinionService } from '../../services/opinion.service';
import { SucursalService } from '../../services/sucursal.service';
import { UsuarioService } from '../../services/usuario.service';

type AdminSection = 'general' | 'categorias' | 'usuarios';
type UserRoleSection = 'ninguno' | 'explorador' | 'empresario';

interface AdminUser {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
}

interface AdminCategory {
  id: number;
  nombre: string;
  icono: string;
  iconoMapa: string;
  habilitada: boolean;
}

interface CategoryDraft {
  id: number | null;
  nombre: string;
  icono: string;
  iconoMapa: string;
}

interface AdminOpinion {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  lugarId: string;
  calificacion: number;
  texto: string;
  fechaCreacion: string;
}

interface PendingItem {
  id: string;
  titulo: string;
  detalle: string;
  tipo: 'Reporte' | 'Mensaje';
  fecha: string;
}

interface DashboardMetrics {
  usuarios: number;
  exploradores: number;
  empresarios: number;
  negocios: number;
  sucursales: number;
  opiniones: number;
  categoriasActivas: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly usuariosDesactivadosStorageKey = 'admin_usuarios_desactivados';
  private readonly negociosDesactivadosStorageKey = 'admin_negocios_desactivados';
  private readonly sucursalesDesactivadasStorageKey = 'admin_sucursales_desactivadas';
  private readonly opinionesOcultasStorageKey = 'admin_opiniones_ocultas';

  seccionActiva: AdminSection = 'general';
  rolGestionActivo: UserRoleSection = 'ninguno';

  nombreAdmin = sessionStorage.getItem('usuario')
  ? JSON.parse(sessionStorage.getItem('usuario')!).nombre
  : localStorage.getItem('nombreUsuario') || 'Administrador';

  cargandoDatos = true;
  cargandoOpinionesModal = false;
  cargandoNegociosEmpresario = false;
  actualizandoNegociosEmpresario = false;

  usuarios: AdminUser[] = [];
  negocios: Negocio[] = [];
  sucursalesPorNegocio: Record<number, Sucursal[]> = {};
  opinionesPorLugar: Record<string, AdminOpinion[]> = {};

  categorias: AdminCategory[] = [];

  mostrarModalCategoria = false;
  draftCategoria: CategoryDraft = this.nuevoDraftCategoria();

  mostrarModalOpiniones = false;
  tituloModalOpiniones = 'Opiniones';
  opinionesModal: AdminOpinion[] = [];

  mostrarPanelPendientes = false;
  pendientes: PendingItem[] = [];

  usuarioSeleccionado: AdminUser | null = null;
  negociosEmpresario: Negocio[] = [];
  negocioExpandidoId: number | null = null;
  @ViewChild('bloqueNegociosEmpresario') private bloqueNegociosEmpresario?: ElementRef<HTMLElement>;

  estadisticas: DashboardMetrics = {
    usuarios: 0,
    exploradores: 0,
    empresarios: 0,
    negocios: 0,
    sucursales: 0,
    opiniones: 0,
    categoriasActivas: 0,
  };

readonly iconosCategoriaDisponibles: string[] = [
    'bi-check-all',
    'bi-droplet-half',
    'bi-heart-pulse-fill',
    'bi-shop-window',
    'bi-signpost-split-fill',
    'bi-slash-square',
    'bi-box2-heart-fill',
    'bi-cake2-fill',
    'bi-egg-fill',
    'bi-egg-fried',
    'bi-fire',
    'bi-mugs-fill',
    'bi-bank',
    'bi-cash-coin',
    'bi-credit-card-2-front',
    'bi-journal-bookmark-fill',
    'bi-journal-text',
    'bi-journal-richtext',
    'bi-sticky-fill',
    'bi-journals',
    'bi-hammer',
    'bi-wrench-adjustable-circle-fill',
    'bi-pincers-fill',
    'bi-screwdriver-fill',
    'bi-toolbox-fill',
    'bi-cone-striped',
    'bi-ladder',
    'bi-dumbell-fill',
    'bi-activity-fill',
    'bi-trophy-fill',
    'bi-handbag-fill',
    'bi-watch',
    'bi-ev-station',
    'bi-fuel-pump',
    'bi-gear-wide-connected',
    'bi-lightning-charge-fill',
    'bi-box-seam-fill',
    'bi-truck',
    'bi-key-fill',
    'bi-shield-fill-check',
    'bi-activity',
    'bi-airplane-fill',
    'bi-bag-heart-fill',
    'bi-balloon-fill',
    'bi-basket-fill',
    'bi-basket2-fill',
    'bi-bicycle',
    'bi-book-fill',
    'bi-briefcase-fill',
    'bi-building-fill',
    'bi-camera-fill',
    'bi-capsule',
    'bi-car-front-fill',
    'bi-cart-fill',
    'bi-coin',
    'bi-controller',
    'bi-cpu-fill',
    'bi-cup-hot-fill',
    'bi-film',
    'bi-flower1',
    'bi-flower3',
    'bi-gear-fill',
    'bi-gift-fill',
    'bi-guitar-fill',
    'bi-hospital-fill',
    'bi-house-fill',
    'bi-laptop-fill',
    'bi-mic-fill',
    'bi-moon-stars-fill',
    'bi-mortarboard-fill',
    'bi-palette-fill',
    'bi-pawn-fill',
    'bi-people-fill',
    'bi-pencil-fill',
    'bi-phone-fill',
    'bi-plug-fill',
    'bi-recycle',
    'bi-scissors',
    'bi-star-fill',
    'bi-stethoscope',
    'bi-tag-fill',
    'bi-tree-fill',
    'bi-truck-fill',
    'bi-water'
];

  readonly iconosMapaDisponibles: string[] = [
  '✂️','💈','💅','🪮','🧖','💄','🪒','🧴','🧼','🪥',
  '🦷','👨‍⚕️','🩺','💊','🏥','🧬','💉','🩻','🧪','🔬',
  '🏋️','⚽','🏀','🎾','🏊','🚴','⛷️','🥊','🎯','🏆',
  '🍽️','🥐','🍕','🌮','🍔','🌯','🥗','🍣','🧁','☕',
  '🛒','🏪','🥫','🧃','🥚','🧀','🥩','🫙','🧂','🍞',
  '💊','🩹','🩺','🏥','🧬','🩼','🦽','🩸','🧫','💉',
  '🌸','🌻','🌹','🪷','🌺','🌼','🌿','🪴','🌱','🍀',
  '👗','👟','👠','👜','💍','🧣','🧤','🧥','👒','🪡',
  '📚','✏️','📝','🖊️','📐','📏','🗂️','📓','📖','🖋️',
  '🐾','🐶','🐱','🐟','🦜','🐇','🐹','🦮','🐕','🩺',
  '🔧','🔨','🪛','🛠️','⚙️','🪚','🧰','🔩','🪝','🪜',
  '🎮','🕹️','👾','🎲','🃏','🎰','🧩','🎳','👑','🏅',
  '📷','📸','🎥','🎞️','🖼️','📹','🔦','💡','🎬','🎭',
  '🎵','🎸','🎹','🎺','🥁','🎻','🎤','🎧','🪗','🪘',
  '🚗','🏍️','🚲','🛵','✈️','🚕','🚌','🚑','🚒','🛺',
  '🔧','🚗','⚙️','🛞','🪛','🔩','🛢️','🏎️','🚘','🔋',
  '👟','👠','👡','👞','🥾','🧦','👢','🩴','👣','🪡',
  '👓','🕶️','🥽','🔭','🔬','👁️','✨','🪞','💫','🌟',
  '🚲','🛵','🏍️','🚴','🛻','🏁','🛣️','⛽','🪖','🧲',
  '⛪','🕌','🛕','🕍','🏛️','🗽','🗼','🎭','🎨','🖌️',
  '💰','💳','🏧','💵','💴','💶','💷','📈','🤝','🏦',
  '🎬','🍿','🎭','🎪','🎠','🎡','🎢','🎯','🎨','🎤',
  '⚽','🏀','🎾','🏈','⚾','🏐','🏉','🥏','🏒','🎽',
  '🏥','🚑','🩺','💊','🩹','🧬','💉','🩻','🫀','🫁',
  '🥐','🥖','🍰','🧁','🎂','🍩','🍪','🥨','🧇','🥞',
  '🔑','🗝️','🔐','🔒','🚪','🪟','🛡️','⚔️','🔓','🏠',
  '💻','🖥️','📱','⌨️','🖱️','🖨️','💾','📡','🔌','🧮',
  '🧪','🔬','🧫','🧬','⚗️','🩸','💉','🧲','🔭','📊',
  '🎁','🎀','🎊','🎉','🎈','🎏','🪅','🎆','🎇','✨',
  '🪟','🔍','🔎','💎','🪞','🫙','🍶','🥃','🫗','🧊',
  '☕','🍳','🥞','🧇','🥐','🥓','🍵','🧆','🫖','🥣',
  '📸','🎞️','🖼️','🎨','✨','🌟','💫','🌈','🎭','🏆',
];

  private usuariosDesactivados = new Set<number>();
  private negociosDesactivados = new Set<number>();
  private sucursalesDesactivadas = new Set<number>();
  private opinionesOcultas = new Set<string>();
  private cacheNegociosEmpresario = new Map<number, Negocio[]>();
  private solicitudNegociosEmpresario?: Subscription;
  private intervaloActualizacionNegociosEmpresarioId?: number;
  private readonly timeoutNegociosEmpresarioMs = 4500;
  private readonly intervaloActualizacionNegociosEmpresarioMs = 8000;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private usuarioService: UsuarioService,
    private categoriaService: CategoriaService,
    private negocioService: NegocioService,
    private sucursalService: SucursalService,
    private opinionService: OpinionService,
  ) { }

    showBizAlert(options: {
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }): void {
    const type = options.type || 'info';
    const icons: Record<string, string> = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️', confirm:'🤔' };
    const titles: Record<string, string> = { success:'¡Éxito!', error:'Error', warning:'Advertencia', info:'Información', confirm:'¿Estás seguro?' };
    const confirmText = options.confirmText || (type === 'confirm' ? 'Confirmar' : 'Aceptar');
    const showCancel = type === 'confirm';
    const cancelText = options.cancelText || 'Cancelar';
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position:'fixed', top:'0', left:'0', width:'100vw', height:'100vh', background:'rgba(15,25,40,0.6)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'9999999' });
    const barColors: Record<string,string> = { success:'linear-gradient(90deg,#27ae60,#2ecc71)', error:'linear-gradient(90deg,#e74c3c,#c0392b)', warning:'linear-gradient(90deg,#f39c12,#e67e22)', info:'linear-gradient(90deg,#3498db,#2980b9)', confirm:'linear-gradient(90deg,#2c3e50,#3498db)' };
    const btnColors: Record<string,string> = { success:'linear-gradient(135deg,#27ae60,#2ecc71)', error:'linear-gradient(135deg,#e74c3c,#c0392b)', warning:'linear-gradient(135deg,#f39c12,#e67e22)', info:'linear-gradient(135deg,#3498db,#2980b9)', confirm:'linear-gradient(135deg,#e74c3c,#c0392b)' };
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:min(400px,90vw);overflow:hidden;font-family:'Montserrat',sans-serif;">
        <div style="height:6px;background:${barColors[type]};"></div>
        <div style="padding:30px 28px 16px;text-align:center;">
          <div style="font-size:2.8rem;margin-bottom:12px;line-height:1;">${icons[type]}</div>
          <p style="margin:0 0 8px;font-size:1.1rem;font-weight:800;color:#1a2636;font-family:'Poppins','Montserrat',sans-serif;">${titles[type]}</p>
          <p style="margin:0;font-size:0.92rem;color:#5a6a7a;line-height:1.5;">${options.message}</p>
        </div>
        <div style="padding:16px 28px 26px;display:flex;gap:10px;justify-content:center;">
          ${showCancel ? `<button id="bizAlertCancel" style="flex:1;max-width:150px;padding:11px 20px;border:none;border-radius:12px;font-weight:700;font-size:0.92rem;cursor:pointer;background:#f0f4f8;color:#4a5568;font-family:'Montserrat',sans-serif;">${cancelText}</button>` : ''}
          <button id="bizAlertConfirm" style="flex:1;max-width:150px;padding:11px 20px;border:none;border-radius:12px;font-weight:700;font-size:0.92rem;cursor:pointer;background:${btnColors[type]};color:#fff;font-family:'Montserrat',sans-serif;">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const remove = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); };
    overlay.querySelector('#bizAlertConfirm')!.addEventListener('click', () => { remove(); options.onConfirm?.(); });
    if (showCancel) overlay.querySelector('#bizAlertCancel')!.addEventListener('click', () => { remove(); options.onCancel?.(); });
  }

  ngOnInit(): void {
    this.cargarEstadosLocales();
    this.cargarCategorias();
    this.cargarDatosAdmin();
  }

  ngOnDestroy(): void {
    this.cancelarCargaNegociosEmpresario();
  }

  get tituloSeccion(): string {
    const titulos: Record<AdminSection, string> = {
      general: 'General',
      categorias: 'Categorías',
      usuarios: 'Gestión de Usuarios',
    };
    return titulos[this.seccionActiva];
  }

  get usuariosExploradores(): AdminUser[] {
    return this.usuarios.filter((usuario) => {
      const rol = (usuario.rol || '').toLowerCase();
      return rol === 'usuario' || rol === 'explorador';
    });
  }

  get usuariosEmpresarios(): AdminUser[] {
    return this.usuarios.filter((usuario) => (usuario.rol || '').toLowerCase() === 'empresario');
  }

  get totalPendientes(): number {
    return this.pendientes.length;
  }

  get cuentasActivas(): number {
    return this.usuarios.filter((usuario) => !this.usuariosDesactivados.has(usuario.id)).length;
  }

  cambiarSeccion(seccion: AdminSection): void {
    this.seccionActiva = seccion;
    if (seccion !== 'categorias') {
      this.mostrarPanelPendientes = false;
    }
    if (seccion !== 'usuarios') {
      this.cancelarCargaNegociosEmpresario();
    }
  }

  seleccionarRolGestion(rol: UserRoleSection): void {
    if (rol !== 'empresario') {
      this.cancelarCargaNegociosEmpresario();
    }
    this.rolGestionActivo = rol;
    this.usuarioSeleccionado = null;
    this.negociosEmpresario = [];
    this.negocioExpandidoId = null;
  }

  volverSelectorRoles(): void {
    this.seleccionarRolGestion('ninguno');
  }

  abrirModalNuevaCategoria(): void {
    this.draftCategoria = this.nuevoDraftCategoria();
    this.mostrarModalCategoria = true;
    this.cdr.detectChanges();
  }

  abrirModalEditarCategoria(categoria: AdminCategory): void {
    this.draftCategoria = {
      id: categoria.id,
      nombre: categoria.nombre,
      icono: categoria.icono,
      iconoMapa: categoria.iconoMapa,
    };
    this.mostrarModalCategoria = true;
    this.cdr.detectChanges();
  }

  cerrarModalCategoria(): void {
    this.mostrarModalCategoria = false;
    this.draftCategoria = this.nuevoDraftCategoria();
  }

  guardarCategoria(): void {
    // Capturar valores ANTES de cualquier cierre o reset
    const nombreLimpio = (this.draftCategoria.nombre || '').trim();
    const id = this.draftCategoria.id;
    const icono = this.draftCategoria.icono;
    const iconoMapa = this.draftCategoria.iconoMapa;

    if (!nombreLimpio) {
      this.showBizAlert({ type: 'warning', message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    // Cerrar el modal INMEDIATAMENTE antes de la llamada HTTP
    this.cerrarModalCategoria();

    if (id) {
      this.categoriaService.actualizarCategoria(id, {
        nombre: nombreLimpio,
        icono,
        iconoMapa,
      }).subscribe({
        next: (actualizada) => {
          this.categorias = this.categorias.map((categoria) =>
            categoria.id === actualizada.id ? this.mapCategoria(actualizada) : categoria,
          );
          this.recalcularEstadisticas();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error actualizando categoria', err);
          // No mostramos alert porque el backend a veces falla pero sí guarda
          this.cargarCategorias(); // recargar para reflejar el estado real
        }
      });
    } else {
      this.categoriaService.crearCategoria({
        nombre: nombreLimpio,
        icono,
        iconoMapa,
        habilitada: true,
      }).subscribe({
        next: (creada) => {
          this.categorias = [this.mapCategoria(creada), ...this.categorias];
          this.recalcularEstadisticas();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creando categoria', err);
          // Recargar para ver si a pesar del error sí se guardó
          this.cargarCategorias();
        }
      });
    }
  }

  alternarEstadoCategoria(categoria: AdminCategory): void {
  const nuevoEstado = !categoria.habilitada;

  this.categoriaService.actualizarEstadoCategoria(categoria.id, nuevoEstado).subscribe({
    next: (actualizada) => {
      const index = this.categorias.findIndex(c => c.id === categoria.id);
      if (index !== -1) {
        this.categorias[index] = this.mapCategoria(actualizada);
        this.categorias = [...this.categorias]; // fuerza detección de cambios
      }
      this.recalcularEstadisticas();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error cambiando estado de categoria', err);
      this.showBizAlert({ type: 'error', message: err?.error?.error || 'No se pudo cambiar el estado de la categoría.' });
    }
  });
}

  eliminarCategoria(categoria: AdminCategory): void {
  this.showBizAlert({
    type: 'confirm',
    message: `¿Seguro que deseas eliminar <strong>"${categoria.nombre}"</strong>? Esta acción no se puede deshacer.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    onConfirm: () => {
      this.categoriaService.eliminarCategoria(categoria.id).subscribe({
        next: () => {
          this.categorias = this.categorias.filter(c => c.id !== categoria.id);
          this.recalcularEstadisticas();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error eliminando categoria', err);
          this.showBizAlert({ type: 'error', message: err?.error?.error || 'No se pudo eliminar. La categoría puede estar en uso.' });
        }
      });
    }
  });
}

  estadoCategoria(categoria: AdminCategory): string {
    if (!categoria.habilitada) {
      return 'DESHABILITADA';
    }
    return this.usoCategoria(categoria) > 0 ? 'EN USO' : 'SIN OCUPAR';
  }

  claseEstadoCategoria(categoria: AdminCategory): string {
    if (!categoria.habilitada) {
      return 'badge-estado deshabilitada';
    }
    return this.usoCategoria(categoria) > 0 ? 'badge-estado en-uso' : 'badge-estado sin-uso';
  }

  usoCategoria(categoria: AdminCategory): number {
    const nombreCategoria = this.normalizarTexto(categoria.nombre);
    return this.negocios.filter((negocio) => {
      const idNegocio = Number(negocio.id);
      const negocioActivo = Number.isFinite(idNegocio) && !this.negociosDesactivados.has(idNegocio);
      const coincide = this.normalizarTexto(negocio.categoria_empresa || '') === nombreCategoria;
      return negocioActivo && coincide;
    }).length;
  }

  abrirPanelPendientes(): void {
    this.mostrarPanelPendientes = !this.mostrarPanelPendientes;
  }

  cerrarPanelPendientes(): void {
    this.mostrarPanelPendientes = false;
  }

  verOpinionesUsuario(usuario: AdminUser): void {
    this.usuarioSeleccionado = usuario;
    this.tituloModalOpiniones = `Opiniones de ${usuario.nombre}`;
    this.mostrarModalOpiniones = true;
    this.cargandoOpinionesModal = true;

    this.opinionService
      .getOpinionesPorUsuario(usuario.id)
      .pipe(catchError(() => of([])))
      .subscribe((response) => {
        const opinionesServicio = this.normalizarOpiniones(response as any[]);
        const opinionesLocales = Object.values(this.opinionesPorLugar)
          .flat()
          .filter((opinion) => opinion.usuarioId === usuario.id);

        const mezcla = [...opinionesServicio, ...opinionesLocales];
        const unicas = new Map<string, AdminOpinion>();
        mezcla.forEach((opinion) => {
          unicas.set(this.claveOpinion(opinion), opinion);
        });
        this.opinionesModal = Array.from(unicas.values());
        this.cargandoOpinionesModal = false;
        this.cdr.detectChanges();
      });
  }

  verOpinionesLugar(lugarId: string | number | null, titulo: string): void {
  this.tituloModalOpiniones = titulo;
  this.mostrarModalOpiniones = true;
  this.cargandoOpinionesModal = true;

  if (lugarId == null) {
    this.opinionesModal = [];
    this.cargandoOpinionesModal = false;
    return;
  }

  const idStr = String(lugarId);

  // Buscar con ambos formatos: "negocio:21" y "21"
  forkJoin([
    this.opinionService.getOpinions(`negocio:${idStr}`).pipe(catchError(() => of([]))),
    this.opinionService.getOpinions(idStr).pipe(catchError(() => of([])))
  ]).subscribe(([porKey, porId]) => {
    const mapa = new Map<string, AdminOpinion>();
    const todas = [
      ...this.normalizarOpiniones(porKey as any[]),
      ...this.normalizarOpiniones(porId as any[])
    ];
    todas.forEach(op => mapa.set(this.claveOpinion(op), op));
    this.opinionesModal = Array.from(mapa.values());
    this.cargandoOpinionesModal = false;
    this.cdr.detectChanges();
  });
}

  cerrarModalOpiniones(): void {
    this.mostrarModalOpiniones = false;
    this.opinionesModal = [];
  }

  opinionEstaOculta(opinion: AdminOpinion): boolean {
    return this.opinionesOcultas.has(this.claveOpinion(opinion));
  }

  alternarVisibilidadOpinion(opinion: AdminOpinion): void {
    const clave = this.claveOpinion(opinion);
    if (this.opinionesOcultas.has(clave)) {
      this.opinionesOcultas.delete(clave);
    } else {
      this.opinionesOcultas.add(clave);
    }
    this.persistirSetTexto(this.opinionesOcultasStorageKey, this.opinionesOcultas);
    this.construirPendientes();
  }

  activarCuenta(usuario: AdminUser): void {
  this.usuarioService.actualizarEstadoCuenta(usuario.id, true).subscribe({
    next: () => {
      this.usuariosDesactivados.delete(usuario.id);
      this.cdr.detectChanges(); // ← ÚNICO CAMBIO
    },
    error: (err) => this.showBizAlert({ type: 'error', message: err?.error?.error || 'No se pudo activar la cuenta.' })
  });
}

desactivarCuenta(usuario: AdminUser): void {
  this.usuarioService.actualizarEstadoCuenta(usuario.id, false).subscribe({
    next: () => {
      this.usuariosDesactivados.add(usuario.id);
      this.cdr.detectChanges(); // ← ÚNICO CAMBIO
    },
    error: (err) => this.showBizAlert({ type: 'error', message: err?.error?.error || 'No se pudo desactivar la cuenta.' })
  });
}

  cuentaActiva(usuario: AdminUser): boolean {
    return !this.usuariosDesactivados.has(usuario.id);
  }

  seleccionarEmpresario(usuario: AdminUser): void {
    const idUsuario = Number(usuario.id);
    this.usuarioSeleccionado = usuario;
    this.negocioExpandidoId = null;
    this.desplazarANegociosEmpresario();

    const respaldoLocal = this.obtenerRespaldoLocalNegociosEmpresario(usuario.id);
    const negociosCache = Number.isFinite(idUsuario) ? this.cacheNegociosEmpresario.get(idUsuario) : undefined;
    const datosInmediatos = negociosCache ?? respaldoLocal;

    this.negociosEmpresario = [...datosInmediatos];
    this.cargandoNegociosEmpresario = false;
    this.actualizandoNegociosEmpresario = true;

    if (Number.isFinite(idUsuario) && !negociosCache) {
      this.cacheNegociosEmpresario.set(idUsuario, [...respaldoLocal]);
    }

    this.consultarNegociosEmpresarioDesdeServidor(usuario, respaldoLocal);
    this.iniciarActualizacionTiempoRealNegociosEmpresario(usuario);
  }

  empresarioSeleccionadoEstaCargando(usuario: AdminUser): boolean {
    return this.cargandoNegociosEmpresario && this.usuarioSeleccionado?.id === usuario.id;
  }

  alternarEstadoNegocio(negocio: Negocio): void {
  const idNegocio = Number(negocio.id);
  if (!Number.isFinite(idNegocio)) return;

  const nuevoEstado = this.negociosDesactivados.has(idNegocio); // true = reactivar, false = dar de baja

  this.negocioService.actualizarEstadoNegocio(idNegocio, nuevoEstado).subscribe({
    next: () => {
      if (nuevoEstado) {
        this.negociosDesactivados.delete(idNegocio);
      } else {
        this.negociosDesactivados.add(idNegocio);
      }
      this.persistirSetNumerico(this.negociosDesactivadosStorageKey, this.negociosDesactivados);
      this.recalcularEstadisticas();
      this.cdr.detectChanges(); // ← fuerza actualización visual inmediata
    },
    error: (err) => this.showBizAlert({ type: 'error', message: err?.error?.error || 'No se pudo cambiar el estado del negocio.' })
  });
}

  negocioActivo(negocio: Negocio): boolean {
    const idNegocio = Number(negocio.id);
    return Number.isFinite(idNegocio) && !this.negociosDesactivados.has(idNegocio);
  }

  alternarDetalleNegocio(negocio: Negocio): void {
    const idNegocio = Number(negocio.id);
    if (!Number.isFinite(idNegocio)) {
      return;
    }

    this.negocioExpandidoId = this.negocioExpandidoId === idNegocio ? null : idNegocio;
    if (this.negocioExpandidoId !== idNegocio) {
      return;
    }

    if (this.sucursalesPorNegocio[idNegocio]) {
      return;
    }

    this.sucursalService
      .getSucursalesByNegocio(idNegocio)
      .pipe(catchError(() => of([])))
      .subscribe((response) => {
        this.sucursalesPorNegocio[idNegocio] = this.normalizarSucursales(response as any[]);
        this.recalcularEstadisticas();
      });
  }

  sucursalesDeNegocio(negocio: Negocio): Sucursal[] {
    const idNegocio = Number(negocio.id);
    if (!Number.isFinite(idNegocio)) {
      return [];
    }
    return this.sucursalesPorNegocio[idNegocio] || [];
  }

  alternarEstadoSucursal(sucursal: Sucursal): void {
    const idSucursal = Number(sucursal.idSucursal);
    if (!Number.isFinite(idSucursal)) {
      return;
    }

    if (this.sucursalesDesactivadas.has(idSucursal)) {
      this.sucursalesDesactivadas.delete(idSucursal);
    } else {
      this.sucursalesDesactivadas.add(idSucursal);
    }
    this.persistirSetNumerico(this.sucursalesDesactivadasStorageKey, this.sucursalesDesactivadas);
  }

  sucursalActiva(sucursal: Sucursal): boolean {
    const idSucursal = Number(sucursal.idSucursal);
    return Number.isFinite(idSucursal) && !this.sucursalesDesactivadas.has(idSucursal);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Sin fecha';
    }
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
      return fecha;
    }
    return date.toLocaleString('es-MX');
  }

  cerrarSesion() {
  localStorage.clear();
  sessionStorage.clear(); // ← NUEVO
  this.router.navigate(['/login']);
}

  private cargarDatosAdmin(): void {
  this.cargandoDatos = true;

  // Cargar usuarios y negocios en paralelo, sin bloquear si uno falla
  this.usuarioService.getUsuariosDebug().pipe(
    catchError(() => of([]))
  ).subscribe((usuarios) => {
    this.usuarios = this.normalizarUsuarios(usuarios as any[]);
    this.recalcularEstadisticas();
    this.cdr.detectChanges();
  });

  this.negocioService.getNegociosPublicos().pipe(
    catchError(() => of([]))
  ).subscribe((negocios) => {
    this.negocios = this.normalizarNegocios(negocios as any[]);
    this.recalcularEstadisticas();
    this.construirPendientes();
    this.cargandoDatos = false;
    this.cdr.detectChanges();
    this.cargarSucursalesYOpinionesGlobales();
  });
}

  private cargarSucursalesYOpinionesGlobales(): void {
  if (!this.negocios.length) return;

  // Sucursales: una por una pero sin bloquear
  this.negocios.forEach((negocio) => {
    const idNegocio = Number(negocio.id);
    if (!Number.isFinite(idNegocio)) return;

    this.sucursalService.getSucursalesByNegocio(idNegocio).pipe(
      catchError(() => of([]))
    ).subscribe((sucursales) => {
      this.sucursalesPorNegocio[idNegocio] = this.normalizarSucursales(sucursales as any[]);
      this.recalcularEstadisticas();
      this.cdr.detectChanges();
    });
  });

  // Opiniones en lotes
  this.cargarOpinionesPorLotes();
}

private cargarOpinionesPorLotes(): void {
  if (!this.negocios.length) return;

  const LOTE = 5;
  let index = 0;

  const cargarSiguienteLote = () => {
    const lote = this.negocios.slice(index, index + LOTE);
    if (!lote.length) {
      this.recalcularEstadisticas();
      this.construirPendientes();
      this.cdr.detectChanges();
      return;
    }

    const tareas = lote.flatMap((negocio) => [
      this.opinionService.getOpinions(`negocio:${negocio.id}`).pipe(catchError(() => of([]))),
      this.opinionService.getOpinions(String(negocio.id)).pipe(catchError(() => of([])))
    ]);

    forkJoin(tareas).subscribe((resultados) => {
      lote.forEach((negocio, i) => {
        const porKey = this.normalizarOpiniones(resultados[i * 2] as any[]);
        const porId  = this.normalizarOpiniones(resultados[i * 2 + 1] as any[]);

        const mapa = new Map<number, AdminOpinion>();
        [...porKey, ...porId].forEach(op => mapa.set(op.id, op));

        this.opinionesPorLugar[String(negocio.id)] = Array.from(mapa.values());
      });
      this.recalcularEstadisticas();
      this.cdr.detectChanges();
      index += LOTE;
      cargarSiguienteLote();
    });
  };

  cargarSiguienteLote();
}

  private cargarEstadosLocales(): void {
    this.usuariosDesactivados = new Set(this.leerArrayNumerica(this.usuariosDesactivadosStorageKey));
    this.negociosDesactivados = new Set(this.leerArrayNumerica(this.negociosDesactivadosStorageKey));
    this.sucursalesDesactivadas = new Set(this.leerArrayNumerica(this.sucursalesDesactivadasStorageKey));
    this.opinionesOcultas = new Set(this.leerArrayTexto(this.opinionesOcultasStorageKey));
  }

  private cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (response) => {
        this.categorias = (response || []).map((categoria) => this.mapCategoria(categoria));
        this.recalcularEstadisticas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('No se pudieron cargar categorias desde BD', err);
        this.categorias = CATEGORIES.map((categoria, index) => ({
          id: index + 1,
          nombre: categoria.label,
          icono: categoria.icon || 'bi-tag-fill',
          iconoMapa: 'bi-geo-alt-fill',
          habilitada: true,
        }));
        this.recalcularEstadisticas();
      }
    });
  }

  private recalcularEstadisticas(): void {
    const totalSucursales = Object.values(this.sucursalesPorNegocio).reduce(
      (total, sucursales) => total + sucursales.length,
      0,
    );
    const totalOpiniones = Object.values(this.opinionesPorLugar).reduce(
      (total, opiniones) => total + opiniones.length,
      0,
    );

    this.estadisticas = {
      usuarios: this.usuarios.length,
      exploradores: this.usuariosExploradores.length,
      empresarios: this.usuariosEmpresarios.length,
      negocios: this.negocios.length,
      sucursales: totalSucursales,
      opiniones: totalOpiniones,
      categoriasActivas: this.categorias.filter((categoria) => categoria.habilitada).length,
    };
  }

  private construirPendientes(): void {
    const reportesPorBajaCalificacion = Object.values(this.opinionesPorLugar)
      .flat()
      .filter((opinion) => opinion.calificacion <= 2)
      .slice(0, 4)
      .map((opinion, index) => ({
        id: `REP-${index + 1}`,
        titulo: `Revision de comentario con ${opinion.calificacion} estrellas`,
        detalle: opinion.texto || 'Comentario sin texto.',
        tipo: 'Reporte' as const,
        fecha: this.formatearFecha(opinion.fechaCreacion),
      }));

    const mensajesBase: PendingItem[] = [
      {
        id: 'MSG-01',
        titulo: 'Mensaje nuevo desde Contáctanos',
        detalle: 'Usuario solicita revisión del estado de su cuenta.',
        tipo: 'Mensaje',
        fecha: 'Hoy',
      },
      {
        id: 'MSG-02',
        titulo: 'Reporte manual del equipo',
        detalle: 'Verificar categoría sin uso por más de 30 días.',
        tipo: 'Reporte',
        fecha: 'Ayer',
      },
    ];

    this.pendientes = [...reportesPorBajaCalificacion, ...mensajesBase];
  }

  private cancelarCargaNegociosEmpresario(): void {
    this.detenerActualizacionTiempoRealNegociosEmpresario();
    this.solicitudNegociosEmpresario?.unsubscribe();
    this.solicitudNegociosEmpresario = undefined;
    this.cargandoNegociosEmpresario = false;
    this.actualizandoNegociosEmpresario = false;
  }

  private iniciarActualizacionTiempoRealNegociosEmpresario(usuario: AdminUser): void {
    this.detenerActualizacionTiempoRealNegociosEmpresario();
    this.intervaloActualizacionNegociosEmpresarioId = window.setInterval(() => {
      if (this.seccionActiva !== 'usuarios' || this.rolGestionActivo !== 'empresario') {
        return;
      }

      if (this.usuarioSeleccionado?.id !== usuario.id) {
        return;
      }

      this.actualizandoNegociosEmpresario = true;
      this.consultarNegociosEmpresarioDesdeServidor(usuario);
    }, this.intervaloActualizacionNegociosEmpresarioMs);
  }

  private detenerActualizacionTiempoRealNegociosEmpresario(): void {
    if (this.intervaloActualizacionNegociosEmpresarioId == null) {
      return;
    }

    window.clearInterval(this.intervaloActualizacionNegociosEmpresarioId);
    this.intervaloActualizacionNegociosEmpresarioId = undefined;
  }

  private consultarNegociosEmpresarioDesdeServidor(usuario: AdminUser, respaldoLocal?: Negocio[]): void {
    const idUsuario = Number(usuario.id);
    const respaldo = respaldoLocal ?? this.obtenerRespaldoLocalNegociosEmpresario(usuario.id);

    this.solicitudNegociosEmpresario?.unsubscribe();
    this.solicitudNegociosEmpresario = this.negocioService
      .getNegociosByUsuario(usuario.id)
      .pipe(
        timeout(this.timeoutNegociosEmpresarioMs),
        catchError(() => of(respaldo)),
        finalize(() => {
          if (this.usuarioSeleccionado?.id === usuario.id) {
            this.cargandoNegociosEmpresario = false;
            this.actualizandoNegociosEmpresario = false;
            this.cdr.detectChanges();
          }
        }),
      )
      .subscribe((response) => {
        if (this.usuarioSeleccionado?.id !== usuario.id) {
          return;
        }

        const normalizados = this.normalizarNegocios(response as any[]);
        this.negociosEmpresario = normalizados;

        if (Number.isFinite(idUsuario)) {
          this.cacheNegociosEmpresario.set(idUsuario, normalizados);
        }
        this.cdr.detectChanges();
      });
  }

  private obtenerRespaldoLocalNegociosEmpresario(idUsuario: number): Negocio[] {
    const idUsuarioNumero = Number(idUsuario);
    if (!Number.isFinite(idUsuarioNumero)) {
      return [];
    }

    return this.negocios.filter((negocio) => Number(negocio.id_usuario) === idUsuarioNumero);
  }

  private desplazarANegociosEmpresario(): void {
    window.setTimeout(() => {
      this.bloqueNegociosEmpresario?.nativeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 60);
  }

  private leerArrayNumerica(key: string): number[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown[];
      return parsed
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
    } catch {
      return [];
    }
  }

  private leerArrayTexto(key: string): string[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as unknown[];
      return parsed.map((value) => String(value));
    } catch {
      return [];
    }
  }

  private persistirSetNumerico(key: string, data: Set<number>): void {
    localStorage.setItem(key, JSON.stringify(Array.from(data.values())));
  }

  private persistirSetTexto(key: string, data: Set<string>): void {
    localStorage.setItem(key, JSON.stringify(Array.from(data.values())));
  }

  private nuevoDraftCategoria(): CategoryDraft {
    const iconoCategoriaDefault = this.iconosCategoriaDisponibles?.[0] || 'bi-shop';
    const iconoMapaDefault = this.iconosMapaDisponibles?.[0] || 'bi-geo-alt-fill';

    return {
      id: null,
      nombre: '',
      icono: iconoCategoriaDefault,
      iconoMapa: iconoMapaDefault,
    };
  }

  private mapCategoria(categoria: Categoria): AdminCategory {
    return {
      id: Number(categoria.id),
      nombre: String(categoria.nombre || ''),
      icono: String(categoria.icono || 'bi-tag-fill'),
      iconoMapa: String(categoria.iconoMapa || 'bi-geo-alt-fill'),
      habilitada: Boolean(categoria.habilitada),
    };
  }

  private normalizarTexto(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private claveOpinion(opinion: AdminOpinion): string {
    return `${opinion.id}_${opinion.usuarioId}_${opinion.lugarId}`;
  }

  private normalizarUsuarios(response: any[]): AdminUser[] {
    return (response || []).map((usuario) => ({
      id: Number(usuario.id || 0),
      nombre: String(usuario.nombre || 'Sin nombre'),
      correo: String(usuario.correo || 'Sin correo'),
      telefono: String(usuario.telefono || 'Sin telefono'),
      rol: String(usuario.rol || ''),
    }));
  }

  private normalizarNegocios(response: any[]): Negocio[] {
    return (response || []).map((negocio) => ({
      ...negocio,
      id: Number(negocio.id || 0),
      id_usuario: Number(negocio.id_usuario || 0),
      nombre_empresa: String(negocio.nombre_empresa || 'Sin nombre'),
      categoria_empresa: String(negocio.categoria_empresa || 'Sin categoria'),
      telefono_empresa: String(negocio.telefono_empresa || ''),
      direccion_empresa: String(negocio.direccion_empresa || ''),
      horario_empresa: String(negocio.horario_empresa || ''),
      correo_empresa: String(negocio.correo_empresa || ''),
      descripcion_empresa: String(negocio.descripcion_empresa || ''),
      fotos_url_empresa: String(negocio.fotos_url_empresa || ''),
      ine_url_representante: String(negocio.ine_url_representante || ''),
      latitud: Number(negocio.latitud || 0),
      longitud: Number(negocio.longitud || 0),
    } as Negocio));
  }

  private normalizarSucursales(response: any[]): Sucursal[] {
    return (response || []).map((sucursal) => ({
      idSucursal: Number(sucursal.idSucursal || sucursal.id_sucursal || 0),
      idNegocio: Number(sucursal.idNegocio || sucursal.negocio?.id || 0),
      latitud: Number(sucursal.latitud || 0),
      longitud: Number(sucursal.longitud || 0),
      direccion: String(sucursal.direccion || ''),
    }));
  }

  private normalizarOpiniones(response: any[]): AdminOpinion[] {
    return (response || []).map((opinion, index) => ({
      id: Number(opinion.id ?? -(index + 1)),
      usuarioId: Number(opinion.usuarioId ?? opinion.usuario?.id ?? 0),
      usuarioNombre: String(opinion.usuarioNombre ?? opinion.usuario?.nombre ?? 'Usuario'),
      lugarId: String(opinion.lugarId ?? opinion.lugar_id ?? ''),
      calificacion: Number(opinion.calificacion ?? 0),
      texto: String(opinion.texto ?? ''),
      fechaCreacion: String(opinion.fechaCreacion ?? opinion.fecha_creacion ?? ''),
    }));
  }
}