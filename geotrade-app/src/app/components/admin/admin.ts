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

  nombreAdmin = localStorage.getItem('nombreUsuario') || 'Administrador';

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
    'bi-shop',
    'bi-cup-hot-fill',
    'bi-cart-fill',
    'bi-bag-heart-fill',
    'bi-flower3',
    'bi-car-front-fill',
    'bi-wrench-adjustable-circle-fill',
    'bi-scissors',
    'bi-capsule',
    'bi-heart-pulse-fill',
    'bi-book-fill',
    'bi-controller',
    'bi-camera-fill',
    'bi-laptop-fill',
    'bi-palette-fill',
    'bi-basket2-fill',
    'bi-bicycle',
    'bi-phone-fill',
  ];

  readonly iconosMapaDisponibles: string[] = [
    'bi-geo-alt-fill',
    'bi-pin-map-fill',
    'bi-signpost-split-fill',
    'bi-geo-fill',
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
      categorias: 'Categorias',
      usuarios: 'Gestion de Usuarios',
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
  }

  abrirModalEditarCategoria(categoria: AdminCategory): void {
    this.draftCategoria = {
      id: categoria.id,
      nombre: categoria.nombre,
      icono: categoria.icono,
      iconoMapa: categoria.iconoMapa,
    };
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria(): void {
    this.mostrarModalCategoria = false;
    this.draftCategoria = this.nuevoDraftCategoria();
  }

  guardarCategoria(): void {
    const nombreLimpio = this.draftCategoria.nombre.trim();
    if (!nombreLimpio) {
      alert('El nombre de la categoria es obligatorio.');
      return;
    }

    if (this.draftCategoria.id) {
      this.categoriaService.actualizarCategoria(this.draftCategoria.id, {
        nombre: nombreLimpio,
        icono: this.draftCategoria.icono,
        iconoMapa: this.draftCategoria.iconoMapa,
      }).subscribe({
        next: (actualizada) => {
          this.categorias = this.categorias.map((categoria) =>
            categoria.id === actualizada.id ? this.mapCategoria(actualizada) : categoria,
          );
          this.recalcularEstadisticas();
          this.cerrarModalCategoria();
        },
        error: (err) => {
          console.error('Error actualizando categoria', err);
          alert(err?.error?.error || 'No se pudo actualizar la categoria.');
        }
      });
    } else {
      this.categoriaService.crearCategoria({
        nombre: nombreLimpio,
        icono: this.draftCategoria.icono,
        iconoMapa: this.draftCategoria.iconoMapa,
        habilitada: true,
      }).subscribe({
        next: (creada) => {
          this.categorias = [this.mapCategoria(creada), ...this.categorias];
          this.recalcularEstadisticas();
          this.cerrarModalCategoria();
        },
        error: (err) => {
          console.error('Error creando categoria', err);
          alert(err?.error?.error || 'No se pudo crear la categoria.');
        }
      });
    }
  }

  alternarEstadoCategoria(categoria: AdminCategory): void {
    const nuevoEstado = !categoria.habilitada;
    this.categoriaService.actualizarEstadoCategoria(categoria.id, nuevoEstado).subscribe({
      next: (actualizada) => {
        categoria.habilitada = actualizada.habilitada;
        this.recalcularEstadisticas();
      },
      error: (err) => {
        console.error('Error cambiando estado de categoria', err);
        alert(err?.error?.error || 'No se pudo cambiar el estado de la categoria.');
      }
    });
  }

  eliminarCategoria(categoria: AdminCategory): void {
    const confirmado = confirm(`¿Seguro que deseas eliminar la categoria "${categoria.nombre}"?`);
    if (!confirmado) {
      return;
    }

    this.categoriaService.eliminarCategoria(categoria.id).subscribe({
      next: () => {
        this.categorias = this.categorias.filter((item) => item.id !== categoria.id);
        this.recalcularEstadisticas();
      },
      error: (err) => {
        console.error('Error eliminando categoria', err);
        alert(err?.error?.error || 'No se pudo eliminar la categoria.');
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

    this.opinionService
      .getOpinions(String(lugarId))
      .pipe(catchError(() => of([])))
      .subscribe((response) => {
        this.opinionesModal = this.normalizarOpiniones(response as any[]);
        this.cargandoOpinionesModal = false;
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
    this.usuariosDesactivados.delete(usuario.id);
    this.persistirSetNumerico(this.usuariosDesactivadosStorageKey, this.usuariosDesactivados);
  }

  desactivarCuenta(usuario: AdminUser): void {
    this.usuariosDesactivados.add(usuario.id);
    this.persistirSetNumerico(this.usuariosDesactivadosStorageKey, this.usuariosDesactivados);
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
    if (!Number.isFinite(idNegocio)) {
      return;
    }

    if (this.negociosDesactivados.has(idNegocio)) {
      this.negociosDesactivados.delete(idNegocio);
    } else {
      this.negociosDesactivados.add(idNegocio);
    }

    this.persistirSetNumerico(this.negociosDesactivadosStorageKey, this.negociosDesactivados);
    this.recalcularEstadisticas();
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
    this.router.navigate(['/login']);
  }

  private cargarDatosAdmin(): void {
    this.cargandoDatos = true;

    forkJoin({
      usuarios: this.usuarioService.getUsuariosDebug().pipe(catchError(() => of([]))),
      negocios: this.negocioService.getNegociosPublicos().pipe(catchError(() => of([]))),
    }).pipe(
      timeout(10000),
      catchError(() => of({ usuarios: [], negocios: [] })),
    ).subscribe(({ usuarios, negocios }) => {
      this.usuarios = this.normalizarUsuarios(usuarios as any[]);
      this.negocios = this.normalizarNegocios(negocios as any[]);
      this.recalcularEstadisticas();
      this.construirPendientes();
      this.cargandoDatos = false;
      this.cdr.detectChanges();
      this.cargarSucursalesYOpinionesGlobales();
    });
  }

  private cargarSucursalesYOpinionesGlobales(): void {
    if (!this.negocios.length) {
      return;
    }

    const tareasSucursales = this.negocios.map((negocio) => {
      const idNegocio = Number(negocio.id);
      if (!Number.isFinite(idNegocio)) {
        return of([]);
      }
      return this.sucursalService.getSucursalesByNegocio(idNegocio).pipe(catchError(() => of([])));
    });

    const tareasOpiniones = this.negocios.map((negocio) =>
      this.opinionService.getOpinions(String(negocio.id)).pipe(catchError(() => of([]))),
    );

    forkJoin([...tareasSucursales, ...tareasOpiniones]).subscribe((resultado) => {
      const limite = this.negocios.length;
      this.negocios.forEach((negocio, index) => {
        const idNegocio = Number(negocio.id);
        if (!Number.isFinite(idNegocio)) {
          return;
        }
        this.sucursalesPorNegocio[idNegocio] = this.normalizarSucursales(resultado[index] as any[]);
        this.opinionesPorLugar[String(idNegocio)] = this.normalizarOpiniones(
          resultado[limite + index] as any[],
        );
      });

      this.recalcularEstadisticas();
      this.construirPendientes();
      this.cdr.detectChanges();
    });
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
        titulo: 'Mensaje nuevo desde Contactanos',
        detalle: 'Usuario solicita revision del estado de su cuenta.',
        tipo: 'Mensaje',
        fecha: 'Hoy',
      },
      {
        id: 'MSG-02',
        titulo: 'Reporte manual del equipo',
        detalle: 'Verificar categoria sin uso por mas de 30 dias.',
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