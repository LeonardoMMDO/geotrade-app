import { Component, AfterViewInit, ViewEncapsulation, OnDestroy, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NgClass, CommonModule } from '@angular/common';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { NegocioService } from '../../services/negocio.service';
import { OpinionService } from '../../services/opinion.service';
import { SucursalService } from '../../services/sucursal.service';
import { CategoriaService } from '../../services/categoria.service';
import { Negocio } from '../../model/negocio';
import { CATEGORIES } from '../../model/categories';
import { Categoria, ExplorerCategoryItem } from '../../model/categoria';
import { Sucursal } from '../../model/sucursal';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Component({

  selector: 'app-explorador',

  standalone: true,

  imports: [RouterLink, FormsModule, NgClass, CommonModule],

  templateUrl: './explorador.html',

  styleUrls: ['./explorador.css'],

  encapsulation: ViewEncapsulation.None

})

export class ExploradorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly bizMarkerByCategory: { [key: string]: { glyph: string; color: string } } = {
    restaurante: { glyph: '🍽️', color: '#e67e22' },
    abarrotes: { glyph: '🛒', color: '#27ae60' },
    estetica: { glyph: '✂️', color: '#e84393' },
    ferreteria: { glyph: '🔧', color: '#7f8c8d' },
    panaderia: { glyph: '🥖', color: '#d35400' },
    papeleria: { glyph: '📚', color: '#2980b9' },
    farmacia: { glyph: '💊', color: '#c0392b' },
    farmacias: { glyph: '💊', color: '#c0392b' },
    gym: { glyph: '🏋️', color: '#1f7a8c' },
    floreria: { glyph: '🌸', color: '#d63384' },
    boutique: { glyph: '👜', color: '#6f42c1' },
    veterinaria: { glyph: '🐾', color: '#16a085' },
    veterinarias: { glyph: '🐾', color: '#16a085' },
    refaccionaria: { glyph: '🚗', color: '#34495e' },
    refaccionarias: { glyph: '🚗', color: '#34495e' }
  };

  // --- GOOGLE MAPS ---
  @ViewChild('mapContainer', { static: false }) mapElement!: ElementRef;
  map!: google.maps.Map;
  lat: number = 19.4326;
  lng: number = -99.1332;
  markers: google.maps.Marker[] = []; // store markers for cleanup
  userMarker!: google.maps.Marker; // ubicación del usuario, permanente
  directionsService?: google.maps.DirectionsService;
  directionsRenderer?: google.maps.DirectionsRenderer;
  selectedPlace: google.maps.places.PlaceResult | null = null;
  selectedBiz: Negocio | null = null;
  // Presentation fields to ensure UI updates reliably
  placeDisplayName: string | null = null;
  placeDisplayAddress: string | null = null;
  // Turn-by-turn steps (plain text)
  routeSteps: string[] = [];
  // Text-to-speech state
  isSpeaking: boolean = false;
  currentStepIndex: number = 0;
  showPlaceDetail: boolean = false;
  showCategories: boolean = true;
  mobileSidebarOpen: boolean = false;
  isMobileScreen: boolean = false;
  showDescriptionPanel: boolean = false;
  private viewportInitialized: boolean = false;
  private searchToken = 0;

  // --- USER DATA ---
  nombreDisplay: string = '';
  correoDisplay: string = '';
  telefonoDisplay: string = '';
  usuarioId: number | null = null; // ID del usuario logueado
  categoriaActiva: string = ''; // currently selected category
  categories: ExplorerCategoryItem[] = this.getFallbackCategories();

  // --- OPINIONES / REVIEWS ---
  showReviewsModal: boolean = false;
  placeReviews: any[] = [];
  isLoadingReviews: boolean = false;
  private reviewsLoadingTimer: ReturnType<typeof setTimeout> | null = null;
  private reviewsRequestToken = 0;
  reviewToast = { visible: false, message: '', type: 'success' as 'success' | 'error' };
  reviewDeleteConfirm = { visible: false, review: null as any };
  newReview = {
    rating: 5,
    text: ''
  };

  private clickListener: any;
  private geolocationWatchId: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private categoriaService: CategoriaService,
    private negocioService: NegocioService,
    private opinionService: OpinionService,
    private sucursalService: SucursalService,
    private cdr: ChangeDetectorRef
  ) { }



  ngOnInit() {
    this.sincronizarViewport();
    this.cargarCategoriasDesdeBD();
    this.cargarDatos();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.sincronizarViewport();
  }



  // Método centralizado para leer del localStorage

  cargarDatos() {

    this.nombreDisplay = localStorage.getItem('nombreUsuario') || '';

    this.correoDisplay = localStorage.getItem('correoUsuario') || '';

    this.telefonoDisplay = localStorage.getItem('telefonoUsuario') || '';

    // Obtener ID del usuario

    const usuarioStr = localStorage.getItem('usuario');

    if (usuarioStr) {

      try {

        const usuario = JSON.parse(usuarioStr);

        this.usuarioId = usuario.id;

      } catch (e) {

        console.warn('Error parseando usuario de localStorage', e);

      }

    }

  }



  ngAfterViewInit() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdown = document.getElementById('profileDropdown');
    const btnOpenEdit = document.getElementById('openEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const btnSaveEdit = document.getElementById('btnSaveEdit');
    const mapPlaceholder = document.getElementById('map');
    const editSection = document.getElementById('editProfileSection');

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

    if (btnSaveEdit) {
      btnSaveEdit.addEventListener('click', (e) => {
        e.preventDefault();
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');
        const id = usuarioGuardado.id;
        const datosActualizados = {
          nombre: this.nombreDisplay,
          correo: this.correoDisplay,
          telefono: this.telefonoDisplay
        };
        this.usuarioService.actualizarUsuario(id, datosActualizados).subscribe({
          next: (usuarioActualizado) => {
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
            localStorage.setItem('nombreUsuario', usuarioActualizado.nombre);
            localStorage.setItem('correoUsuario', usuarioActualizado.correo);
            localStorage.setItem('telefonoUsuario', usuarioActualizado.telefono || '');
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

    if (profileBtn && dropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
    }

    if (btnCancelEdit) {
      btnCancelEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editSection && mapPlaceholder) {
          editSection.style.display = 'none';
          mapPlaceholder.style.display = 'flex';
        }
      });
    }

    // Close dropdown only when clicking outside user-profile area
    this.clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdown && !target.closest('.user-profile')) {
        dropdown.classList.remove('show');
      }
    };
    document.addEventListener('click', this.clickListener);

    // after wiring UI, load maps
    this.mapsLoader.load()
      .then(() => this.obtenerUbicacionActual())
      .catch(err => {
        console.error('Error cargando Google Maps API:', err);
        // Mostrar mensaje amigable al usuario
        alert('No se pudo cargar Google Maps. Verifica la clave y las restricciones en la consola de Google Cloud.');
      });
  }







  ngOnDestroy() {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
    if (this.geolocationWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }
    // Clean up all markers when component is destroyed
    this.limpiarMarcadores();
  }

  seleccionarCategoria(tipo: string, etiqueta?: string) {
    const tipoNormalizado = this.normalizeCategoryName(tipo);
    this.categoriaActiva = tipoNormalizado;
    // hide any open place detail when selecting a new category
    this.showPlaceDetail = false;
    this.showCategories = true;
    this.showDescriptionPanel = false;
    this.cdr.markForCheck(); // Force change detection
    // recenter map when searching
    if (this.map) {
      const center = new google.maps.LatLng(this.lat, this.lng);
      this.map.setCenter(center);
    }
    this.buscarLugares(tipoNormalizado, etiqueta || tipo);
    if (this.isMobileScreen) {
      this.mobileSidebarOpen = false;
    }
  }

  private limpiarMarcadores() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    // console.log('marcadores limpios');
  }

  // --- MAP HELPERS ---
  obtenerUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lat = pos.coords.latitude;
          this.lng = pos.coords.longitude;
          this.cargarMapa();
          this.iniciarSeguimientoUbicacion();
        },
        () => this.cargarMapa()
      );
    } else {
      this.cargarMapa();
    }
  }

  private iniciarSeguimientoUbicacion() {
    if (!navigator.geolocation) return;

    if (this.geolocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }

    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.lat = pos.coords.latitude;
        this.lng = pos.coords.longitude;

        if (this.userMarker) {
          this.userMarker.setPosition({ lat: this.lat, lng: this.lng });
        }
      },
      (error) => {
        console.warn('No se pudo actualizar la ubicación en tiempo real:', error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  }

  cargarMapa() {
    // remove placeholder text if present
    const el = this.mapElement.nativeElement as HTMLElement;
    el.innerHTML = '';

    const coords = new google.maps.LatLng(this.lat, this.lng);
    const options: google.maps.MapOptions = {
      center: coords,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      styles: [
        { featureType: 'landscape.natural', elementType: 'geometry.fill',
          stylers: [{ visibility: 'on' }, { color: '#e0efef' }] },
        { featureType: 'poi', elementType: 'geometry.fill',
          stylers: [{ visibility: 'on' }, { hue: '#1900ff' }, { color: '#c0e8e8' }] },
        { featureType: 'road', elementType: 'geometry',
          stylers: [{ lightness: 100 }, { visibility: 'simplified' }] },
        { featureType: 'road', elementType: 'labels',
          stylers: [{ visibility: 'on' }] },
        { featureType: 'transit.line', elementType: 'geometry',
          stylers: [{ visibility: 'on' }, { lightness: 700 }] },
        { featureType: 'water', elementType: 'all',
          stylers: [{ color: '#7dcdcd' }] }
      ]
    };
    this.map = new google.maps.Map(el, options);
    // create permanent user location marker
    this.userMarker = new google.maps.Marker({
      position: coords,
      map: this.map,
      title: 'Tu ubicación actual',
      label: 'Mi'
    });

    // inicializa las utilidades de direcciones
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      preserveViewport: true
    });
    // no ponemos map todavía hasta que el usuario pida indicaciones
  }

  buscarLugares(tipo: string, etiquetaCategoria: string) {
    const currentToken = ++this.searchToken;
    // console.log('buscando lugares para', tipo);
    if (!this.map) {
      console.warn('mapa no inicializado');
      return;
    }
    // limpiar marcadores previos
    this.limpiarMarcadores();

    const service = new google.maps.places.PlacesService(this.map);
    const mapping: { [key: string]: string } = {
      restaurantes: 'restaurant',
      refaccionarias: 'car_repair',
      estetica: 'beauty_salon',
      abarrotes: 'grocery_or_supermarket',
      farmacias: 'pharmacy',
      farmacia: 'pharmacy',
      gym: 'gym',
      florería: 'florist',
      floreria: 'florist',
      boutique: 'clothing_store',
      papelerias: 'book_store',
      veterinarias: 'veterinary_care'
    };
    const tipoNormalizado = this.normalizeCategoryName(tipo);
    const request: google.maps.places.PlaceSearchRequest = {
      location: { lat: this.lat, lng: this.lng },
      radius: 2000
    };

    const googleType = mapping[tipoNormalizado];
    if (googleType) {
      (request as any).type = googleType;
    } else {
      (request as any).type = 'store';
      (request as any).keyword = etiquetaCategoria;
    }

    service.nearbySearch(request, (results, status) => {
      if (currentToken !== this.searchToken) return;
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // console.log(`encontrados ${results.length} lugares de tipo "${tipo}"`);
        results.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: place.name || ''
            });
            // open place detail when marker is clicked; run inside Angular zone
            marker.addListener('click', () => this.ngZone.run(() => this.onPlaceMarkerClick(place)));
            this.markers.push(marker);
          }
        });
      } else {
        console.warn(`Error en búsqueda de "${tipo}":`, status);
      }
    });

    // Also show user-submitted negocios from backend that match this category
    this.negocioService.getNegociosPublicos().subscribe({
      next: (lista) => {
        if (currentToken !== this.searchToken) return;
        lista.forEach((biz: Negocio) => {
          // require lat/lng to show on map
          if (biz.latitud != null && biz.longitud != null) {
            const bizCategory = this.normalizeCategoryName(biz.categoria_empresa || '');
            if (bizCategory.includes(tipoNormalizado) || tipoNormalizado.includes(bizCategory) || bizCategory === tipoNormalizado) {
              const pos = new google.maps.LatLng(biz.latitud!, biz.longitud!);

              const marker = new google.maps.Marker({
                position: pos,
                map: this.map,
                title: biz.nombre_empresa,
                icon: this.getBizMarkerIcon(biz.categoria_empresa),
                zIndex: 999 // Mostrar muy por encima de Google Places
              });

              marker.addListener('click', () => this.ngZone.run(() => this.showNegocioDetail(biz)));
              this.markers.push(marker);

              // También pintar sucursales del negocio registrado
              const idNegocio = (biz.id || (biz as any).id_negocio) as number;
              if (idNegocio) {
                this.sucursalService.getSucursalesByNegocio(idNegocio).subscribe({
                  next: (sucursales: Sucursal[]) => {
                    if (currentToken !== this.searchToken) return;
                    (sucursales || []).forEach((sucursal, idx) => {
                      if (sucursal.latitud == null || sucursal.longitud == null) return;
                      const posSucursal = new google.maps.LatLng(sucursal.latitud, sucursal.longitud);
                      const markerSucursal = new google.maps.Marker({
                        position: posSucursal,
                        map: this.map,
                        title: `${biz.nombre_empresa} - Sucursal ${idx + 1}`,
                        icon: this.getBizMarkerIcon(biz.categoria_empresa),
                        zIndex: 998
                      });

                      const negocioSucursal: Negocio = {
                        ...biz,
                        direccion_empresa: sucursal.direccion || biz.direccion_empresa,
                        latitud: sucursal.latitud,
                        longitud: sucursal.longitud,
                        nombre_empresa: `${biz.nombre_empresa} - Sucursal ${idx + 1}`
                      };
                      (negocioSucursal as any).idSucursal = sucursal.idSucursal;
                      (negocioSucursal as any).esSucursal = true;

                      markerSucursal.addListener('click', () => this.ngZone.run(() => this.showNegocioDetail(negocioSucursal)));
                      this.markers.push(markerSucursal);
                    });
                  },
                  error: (err) => console.warn('No se pudieron cargar sucursales del negocio', err)
                });
              }
            }
          }
        });
      },
      error: (err) => console.warn('No se pudieron cargar negocios públicos', err)
    });
  }

  onPlaceMarkerClick(place: google.maps.places.PlaceResult) {
    console.log('✅ Marcador clickeado:', place.name);
    if (!this.map) return;
    this.resetReviewsState();
    this.selectedBiz = null;
    const service = new google.maps.places.PlacesService(this.map);
    if (place.place_id) {
      service.getDetails({ placeId: place.place_id }, (details, status) => {
        // callback from Maps API may be outside Angular zone
        this.ngZone.run(() => {
          console.log('📍 Detalles obtenidos, status:', status);
          if (status === google.maps.places.PlacesServiceStatus.OK && details) {
            this.selectedPlace = details as google.maps.places.PlaceResult;
            // prepare display fields with sensible fallbacks
            this.placeDisplayName = (this.selectedPlace.name || this.selectedPlace.formatted_phone_number || '') as string;
            this.placeDisplayAddress = (this.selectedPlace.formatted_address || (this.selectedPlace as any).vicinity || this.selectedPlace.name || '') as string;
            this.routeSteps = []; // clear previous route steps
            this.showDescriptionPanel = false;
            console.log('📌 details.name =', (details as any).name);
          } else {
            this.selectedPlace = place;
            this.placeDisplayName = place.name || '';
            this.placeDisplayAddress = (place.vicinity || place.name || '') as string;
            this.showDescriptionPanel = false;
            console.log('ℹ️ Usando objeto place (sin details completos):', place.name);
          }
          // Actualizar vistas inmediatamente para evitar estado desincronizado
          this.showPlaceDetail = true;
          this.showCategories = false;
          if (this.isMobileScreen) {
            this.mobileSidebarOpen = true;
          }
          try {
            this.cdr.detectChanges(); // force immediate change detection
          } catch (e) {
            // fallback to markForCheck if detectChanges not permitted
            this.cdr.markForCheck();
          }
          console.log('✅ Estado actualizado. showPlaceDetail=', this.showPlaceDetail, 'showCategories=', this.showCategories, 'selectedPlace=', this.selectedPlace?.name);
        });
      });
    } else {
      this.selectedPlace = place;
      this.placeDisplayName = place.name || '';
      this.placeDisplayAddress = (place.vicinity || place.name || '') as string;
      this.showDescriptionPanel = false;
      this.showPlaceDetail = true;
      this.showCategories = false;
      if (this.isMobileScreen) {
        this.mobileSidebarOpen = true;
      }
      this.cdr.markForCheck(); // Force change detection
      console.log('✅ Sin place_id. showPlaceDetail=true, showCategories=false');
    }
  }

  showNegocioDetail(biz: Negocio) {
    console.log('✅ Negocio clickeado:', biz.nombre_empresa);
    this.resetReviewsState();
    this.selectedPlace = null;
    this.selectedBiz = biz;
    this.placeDisplayName = biz.nombre_empresa || '';
    this.placeDisplayAddress = biz.direccion_empresa || '';
    this.showDescriptionPanel = false;
    this.showPlaceDetail = true;
    this.showCategories = false;
    if (this.isMobileScreen) {
      this.mobileSidebarOpen = true;
    }
    try {
      this.cdr.detectChanges();
    } catch (e) {
      this.cdr.markForCheck();
    }
    console.log('✅ showPlaceDetail=true, showCategories=false');
  }

  backToCategories() {
    this.resetReviewsState();
    this.showPlaceDetail = false;
    this.showCategories = true;
    this.selectedPlace = null;
    this.showDescriptionPanel = false;
    if (this.isMobileScreen) {
      this.mobileSidebarOpen = true;
    }
    // remove route when we hide detail
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }
    this.cdr.markForCheck(); // Force change detection
  }

  getPlacePhotoUrl(maxWidth: number = 400): string | null {
    try {
      if (!this.selectedPlace) return null;
      const photos = (this.selectedPlace as any).photos;
      if (photos && photos.length) {
        // `getUrl` is provided by the PlacesPhoto object from the Maps JS API
        return photos[0].getUrl({ maxWidth });
      }
    } catch (e) {
      console.warn('No se pudo obtener foto del lugar', e);
    }
    return null;
  }

  // Safe helper to determine if the currently selected place is open.
  // Uses the `isOpen()` method when available (recommended by Places API),
  // falls back to legacy properties if needed.
  isPlaceOpen(): boolean {
    if (!this.selectedPlace || !this.selectedPlace.opening_hours) return false;
    const oh: any = this.selectedPlace.opening_hours;
    try {
      if (typeof oh.isOpen === 'function') {
        return !!oh.isOpen();
      }
      if (typeof oh.open_now !== 'undefined') {
        return !!oh.open_now;
      }
      if (typeof oh.openNow !== 'undefined') {
        return !!oh.openNow;
      }
    } catch (e) {
      console.warn('Error comprobando horario de apertura', e);
    }
    return false;
  }

  getBizMapsLink(): string {
    if (!this.selectedBiz) return 'https://www.google.com/maps';
    const q = encodeURIComponent((this.selectedBiz.nombre_empresa || '') + ' ' + (this.selectedBiz.direccion_empresa || ''));
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  getMapsLink(): string {
    if (!this.selectedPlace) return 'https://www.google.com/maps';
    if ((this.selectedPlace as any).url) return (this.selectedPlace as any).url;
    if (this.selectedPlace.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${this.selectedPlace.place_id}`;
    }
    const addr = encodeURIComponent(this.selectedPlace.formatted_address || this.selectedPlace.vicinity || this.selectedPlace.name || '');
    return `https://www.google.com/maps/search/?api=1&query=${addr}`;
  }

  openDirections() {
    if (!this.map) return;
    if (this.isMobileScreen) {
      this.mobileSidebarOpen = false;
    }
    // clear any previous route
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }

    if (this.directionsService && this.directionsRenderer) {
      this.directionsRenderer.setMap(this.map);
      const origin = new google.maps.LatLng(this.lat, this.lng);
      let destination: google.maps.LatLng | null = null;

      if (this.selectedPlace?.geometry?.location) {
        destination = this.selectedPlace.geometry.location as google.maps.LatLng;
      } else if (this.selectedBiz && this.selectedBiz.latitud != null && this.selectedBiz.longitud != null) {
        destination = new google.maps.LatLng(this.selectedBiz.latitud, this.selectedBiz.longitud);
      }

      if (!destination) {
        console.warn('No hay destino disponible para la ruta');
        return;
      }

      this.directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        this.ngZone.run(() => {
          if (status === 'OK' && result) {
            this.directionsRenderer?.setDirections(result);
            // extract simple, textual turn-by-turn steps
            try {
              const steps: string[] = [];
              result.routes?.forEach(r => {
                r.legs?.forEach(leg => {
                  leg.steps?.forEach(s => {
                    // strip HTML tags from instructions
                    const html = (s as any).instructions || (s as any).html_instructions || '';
                    const text = html.replace(/<[^>]*>/g, '');
                    steps.push(text);
                  });
                });
              });
              this.routeSteps = steps;
              this.currentStepIndex = 0;
              this.isSpeaking = false;
            } catch (e) {
              console.warn('No se pudieron extraer pasos de la ruta', e);
              this.routeSteps = [];
              this.currentStepIndex = 0;
              this.isSpeaking = false;
            }
          } else {
            console.warn('Error al calcular ruta:', status);
          }
        });
      });
    }
  }

  callPhone() {
    if (!this.selectedPlace?.formatted_phone_number) return;
    const tel = `tel:${this.selectedPlace.formatted_phone_number}`;
    window.location.href = tel;
  }

  toggleSidebar(): void {
    if (!this.isMobileScreen) return;
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeSidebar(): void {
    if (!this.isMobileScreen) return;
    this.mobileSidebarOpen = false;
  }

  trackByCategory(index: number, categoria: ExplorerCategoryItem): number {
    return Number.isFinite(categoria.id) ? categoria.id : index;
  }

  shouldShowDetailsButton(): boolean {
    if (this.selectedBiz) {
      return true;
    }
    return this.getExternalDescription().length > 0;
  }

  toggleDescriptionPanel(): void {
    this.showDescriptionPanel = !this.showDescriptionPanel;
  }

  getSelectedDescription(): string {
    if (this.selectedBiz) {
      const desc = (this.selectedBiz.descripcion_empresa || '').trim();
      return desc || 'Este negocio todavia no ha agregado una descripcion.';
    }
    return this.getExternalDescription();
  }

  private getExternalDescription(): string {
    const placeAny = this.selectedPlace as any;
    const summary = placeAny?.editorial_summary?.overview;
    return typeof summary === 'string' ? summary.trim() : '';
  }

  getTodayHours(): string | null {
    try {
      const oh = (this.selectedPlace as any)?.opening_hours;
      if (!oh?.weekday_text?.length) return null;
      const dayIndex = new Date().getDay();
      const adjusted = (dayIndex + 6) % 7;
      const line: string = oh.weekday_text[adjusted] || '';
      const colonIdx = line.indexOf(':');
      return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : line.trim();
    } catch {
      return null;
    }
  }

  private sincronizarViewport(): void {
    this.isMobileScreen = window.innerWidth <= 991;

    if (!this.isMobileScreen) {
      this.mobileSidebarOpen = true;
      this.viewportInitialized = true;
      return;
    }

    if (!this.viewportInitialized) {
      this.mobileSidebarOpen = true;
      this.viewportInitialized = true;
    }
  }

  private cargarCategoriasDesdeBD(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (lista: Categoria[]) => {
        const listaValida = Array.isArray(lista) ? lista : [];
        const habilitadas = listaValida.filter((categoria) => categoria.habilitada !== false);
        const categoriasMapeadas = habilitadas.map((categoria) => this.mapCategoriaExplorador(categoria));

        if (categoriasMapeadas.length) {
          this.categories = categoriasMapeadas;
        } else {
          this.categories = this.getFallbackCategories();
        }
        this.refrescarVista();
      },
      error: (err) => {
        console.error('No se pudieron cargar categorias desde BD', err);
        this.categories = this.getFallbackCategories();
        this.refrescarVista();
      }
    });
  }

  private refrescarVista(): void {
    try {
      this.cdr.detectChanges();
    } catch {
      this.cdr.markForCheck();
    }
  }

  private mapCategoriaExplorador(categoria: Categoria): ExplorerCategoryItem {
    const label = (categoria.nombre || '').trim() || 'Categoria';
    const value = this.normalizeCategoryName(label);
    return {
      id: Number(categoria.id),
      label,
      value,
      icon: this.getResolvedCategoryIcon(value, categoria.icono),
      mapIcon: (categoria.iconoMapa || '').trim() || 'bi-geo-alt-fill',
      enabled: Boolean(categoria.habilitada)
    };
  }

  private getResolvedCategoryIcon(value: string, icono: string | null | undefined): string {
    const iconoLimpio = (icono || '').trim();

    // Reemplaza iconos no soportados por bootstrap-icons en esta version.
    if (iconoLimpio === 'bi-fork-knife' || value === 'restaurantes') {
      return 'bi-cup-hot-fill';
    }

    return iconoLimpio || this.getFallbackIcon(value);
  }

  private getFallbackCategories(): ExplorerCategoryItem[] {
    return CATEGORIES.map((categoria, index) => ({
      id: index + 1,
      label: categoria.label,
      value: this.normalizeCategoryName(categoria.value || categoria.label),
      icon: categoria.icon || 'bi-grid-fill',
      mapIcon: 'bi-geo-alt-fill',
      enabled: true,
    }));
  }

  private getFallbackIcon(value: string): string {
    const match = CATEGORIES.find((categoria) =>
      this.normalizeCategoryName(categoria.value || categoria.label) === value,
    );
    return match?.icon || 'bi-grid-fill';
  }

  private normalizeCategoryName(value: string | null | undefined): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private getBizMarkerIcon(categoria: string | null | undefined): google.maps.Icon {
    const normalized = this.normalizeCategoryName(categoria);
    const matched = Object.keys(this.bizMarkerByCategory).find((key) => normalized.includes(key));
    const markerStyle = this.bizMarkerByCategory[matched || ''] || { glyph: '🏪', color: '#e74c3c' };

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
          </filter>
        </defs>
        <circle cx="36" cy="36" r="30" fill="${markerStyle.color}" opacity="0.22"/>
        <circle cx="36" cy="36" r="24" fill="#ffffff" stroke="${markerStyle.color}" stroke-width="4" filter="url(#shadow)"/>
        <text x="36" y="39" text-anchor="middle" font-size="24" font-family="Segoe UI Emoji, Noto Color Emoji, Arial" dominant-baseline="middle">${markerStyle.glyph}</text>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(56, 56),
      anchor: new google.maps.Point(28, 28)
    };
  }

  getBizPhotoUrl(biz: Negocio | null): string | null {
    if (!biz || !biz.fotos_url_empresa) return null;
    const parts = biz.fotos_url_empresa.split(',').filter(p => p && p.trim());
    if (!parts.length) return null;
    const first = parts[0];
    // backend stores paths like /uploads/xxx
    if (first.startsWith('http')) return first;
    return `http://localhost:8080${first}`;
  }

  // ==== Text-to-Speech helpers ====
  private speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-MX';
    window.speechSynthesis.speak(utter);
  }

  speakSteps() {
    if (!this.routeSteps.length) return;
    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      return;
    }
    this.isSpeaking = true;
    this.currentStepIndex = 0;
    const speakNext = () => {
      if (this.currentStepIndex >= this.routeSteps.length || !this.isSpeaking) {
        this.isSpeaking = false;
        return;
      }
      const step = this.routeSteps[this.currentStepIndex];
      this.speak(step);
      this.currentStepIndex++;
      const onend = () => {
        window.speechSynthesis.removeEventListener('end', onend);
        setTimeout(speakNext, 500);
      };
      window.speechSynthesis.addEventListener('end', onend);
    };
    speakNext();
  }

  // ===== OPINIONES / REVIEWS =====
  private getOpinionFetchKeys(): string[] {
    if (this.selectedPlace?.place_id) {
      return [this.selectedPlace.place_id];
    }

    if (!this.selectedBiz) return [];

    const sucursalId = (this.selectedBiz as any).idSucursal as number | undefined;
    if (sucursalId) {
      return [`sucursal:${sucursalId}`];
    }

    const idNegocio = this.selectedBiz.id;
    if (idNegocio == null) return [];
    // Mantener compatibilidad con opiniones viejas guardadas solo con "id"
    return [`negocio:${idNegocio}`, String(idNegocio)];
  }

  private getOpinionSaveKey(): string | null {
    if (this.selectedPlace?.place_id) {
      return this.selectedPlace.place_id;
    }

    if (!this.selectedBiz) return null;

    const sucursalId = (this.selectedBiz as any).idSucursal as number | undefined;
    if (sucursalId) {
      return `sucursal:${sucursalId}`;
    }

    if (this.selectedBiz.id == null) return null;
    return `negocio:${this.selectedBiz.id}`;
  }

  openReviewsModal() {
    this.showReviewsModal = true;
    this.placeReviews = [];
    this.detenerLoaderOpiniones();
    const currentRequestToken = ++this.reviewsRequestToken;
    this.iniciarLoaderOpiniones(currentRequestToken);
    const keys = this.getOpinionFetchKeys();
    if (!keys.length) {
      this.placeReviews = [];
      this.detenerLoaderOpiniones();
      this.refrescarVista();
      return;
    }

    forkJoin(
      keys.map((k) => this.opinionService.getOpinions(k).pipe(catchError(() => of([]))))
    ).subscribe({
      next: (groups) => {
        if (currentRequestToken !== this.reviewsRequestToken || !this.showReviewsModal) return;
        this.detenerLoaderOpiniones();
        const merged = (groups || []).flat();
        const dedup = new Map<string, any>();
        merged.forEach((item: any) => {
          const key = String(item.id ?? '') + '|' + String(item.usuarioId ?? '') + '|' + String(item.texto ?? '');
          if (!dedup.has(key)) dedup.set(key, item);
        });

        this.placeReviews = Array.from(dedup.values()).map(op => ({
          id: op.id,
          usuarioId: op.usuarioId,
          userName: op.usuarioNombre || 'Usuario anónimo',
          rating: op.calificacion,
          text: op.texto,
          timestamp: op.fechaCreacion
        }));
        this.refrescarVista();
      },
      error: err => {
        if (currentRequestToken !== this.reviewsRequestToken || !this.showReviewsModal) return;
        this.detenerLoaderOpiniones();
        console.warn('Error cargando opiniones', err);
        this.placeReviews = [];
        this.refrescarVista();
      }
    });
  }

  closeReviewsModal() {
    this.showReviewsModal = false;
    this.detenerLoaderOpiniones();
    this.reviewsRequestToken++;
  }

  private resetReviewsState(): void {
    this.showReviewsModal = false;
    this.placeReviews = [];
    this.detenerLoaderOpiniones();
    this.reviewsRequestToken++;
  }

  private iniciarLoaderOpiniones(requestToken: number): void {
    this.reviewsLoadingTimer = setTimeout(() => {
      if (requestToken !== this.reviewsRequestToken || !this.showReviewsModal) return;
      this.isLoadingReviews = true;
      this.refrescarVista();
    }, 350);
  }

  private detenerLoaderOpiniones(): void {
    if (this.reviewsLoadingTimer) {
      clearTimeout(this.reviewsLoadingTimer);
      this.reviewsLoadingTimer = null;
    }
    this.isLoadingReviews = false;
  }

  submitReview() {
    if (!this.newReview.text.trim()) {
      this.mostrarReviewToast('Por favor escribe una opinión.', 'error');
      return;
    }

    if (!this.usuarioId) {
      this.mostrarReviewToast('Debes estar logueado para enviar una opinión.', 'error');
      return;
    }

    const lugarId = this.getOpinionSaveKey();
    if (!lugarId) {
      this.mostrarReviewToast('No se pudo identificar el lugar.', 'error');
      return;
    }

    const opinion = {
      lugarId: lugarId,
      calificacion: this.newReview.rating,
      texto: this.newReview.text.trim()
    };

    this.opinionService.saveOpinion(opinion, this.usuarioId).subscribe({
      next: saved => {
        this.placeReviews.unshift({
          id: saved.id,
          usuarioId: saved.usuarioId,
          userName: this.nombreDisplay || 'Usuario',
          rating: saved.calificacion,
          text: saved.texto,
          timestamp: saved.fechaCreacion
        });
        this.newReview = { rating: 5, text: '' };
        this.mostrarReviewToast('¡Gracias por tu opinión!', 'success');
      },
      error: err => {
        console.error('Error guardando opinión', err);
        this.mostrarReviewToast('Error al guardar la opinión. Inténtalo de nuevo.', 'error');
      }
    });
  }

  private mostrarReviewToast(message: string, type: 'success' | 'error') {
    this.reviewToast = { visible: true, message, type };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.reviewToast.visible = false;
      this.cdr.markForCheck();
    }, 3500);
  }

  canDeleteReview(review: any): boolean {
    if (!this.usuarioId) return false;
    return Number(review?.usuarioId) === Number(this.usuarioId);
  }

  requestDeleteReview(review: any): void {
    if (!this.usuarioId || !review?.id) {
      this.mostrarReviewToast('No se pudo identificar la opinión.', 'error');
      return;
    }
    this.reviewDeleteConfirm = { visible: true, review };
    this.cdr.markForCheck();
  }

  cancelarDeleteReview(): void {
    this.reviewDeleteConfirm = { visible: false, review: null };
    this.cdr.markForCheck();
  }

  confirmarDeleteReview(): void {
    const review = this.reviewDeleteConfirm.review;
    this.reviewDeleteConfirm = { visible: false, review: null };
    this.deleteReview(review);
  }

  deleteReview(review: any): void {
    this.opinionService.deleteOpinion(review.id, this.usuarioId!).subscribe({
      next: () => {
        this.placeReviews = this.placeReviews.filter(r => Number(r.id) !== Number(review.id));
        this.mostrarReviewToast('Opinión eliminada correctamente.', 'success');
      },
      error: (err) => {
        if (err?.status === 405) {
          this.opinionService.deleteOpinionFallback(review.id, this.usuarioId as number).subscribe({
            next: () => {
              this.placeReviews = this.placeReviews.filter(r => Number(r.id) !== Number(review.id));
              this.mostrarReviewToast('Opinión eliminada correctamente.', 'success');
            },
            error: (fallbackErr) => {
              console.error('Error eliminando opinión (fallback)', fallbackErr);
              this.mostrarReviewToast('No se pudo eliminar. Reinicia el backend e inténtalo de nuevo.', 'error');
            }
          });
          return;
        }
        console.error('Error eliminando opinión', err);
        this.mostrarReviewToast('No se pudo eliminar la opinión. Inténtalo de nuevo.', 'error');
      }
    });
  }
}
