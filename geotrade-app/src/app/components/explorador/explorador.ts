import { Component, AfterViewInit, ViewEncapsulation, OnDestroy, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NgClass, CommonModule } from '@angular/common';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { NegocioService } from '../../services/negocio.service';
import { OpinionService } from '../../services/opinion.service';
import { SucursalService } from '../../services/sucursal.service';
import { Negocio } from '../../model/negocio';
import { CATEGORIES } from '../../model/categories';
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
  private searchToken = 0;

  // --- USER DATA ---
  nombreDisplay: string = '';
  correoDisplay: string = '';
  telefonoDisplay: string = '';
  passwordDisplay: string = '';
  usuarioId: number | null = null; // ID del usuario logueado
  mostrarPassword: boolean = false;
  categoriaActiva: string = ''; // currently selected category
  categories = CATEGORIES;

  // --- OPINIONES / REVIEWS ---
  showReviewsModal: boolean = false;
  placeReviews: any[] = [];
  newReview = {
    rating: 5,
    text: ''
  };

  private clickListener: any;

  constructor(
    private usuarioService: UsuarioService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private negocioService: NegocioService,
    private opinionService: OpinionService,
    private sucursalService: SucursalService,
    private cdr: ChangeDetectorRef
  ) {}



  ngOnInit() {

    this.cargarDatos();

  }



  // Método centralizado para leer del localStorage

  cargarDatos() {

    this.nombreDisplay = localStorage.getItem('nombreUsuario') || '';

    this.correoDisplay = localStorage.getItem('correoUsuario') || '';

    this.telefonoDisplay = localStorage.getItem('telefonoUsuario') || '';

    this.passwordDisplay = localStorage.getItem('passwordUsuario') || '';

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
    const categories = document.querySelectorAll('.category-item');
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

    // categories are now handled via Angular template (click bindings)

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
      if (dropdown && !target.closest('.user-profile') && !target.closest('.btn-toggle-password')) {
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
    // Clean up all markers when component is destroyed
    this.limpiarMarcadores();
  }

  seleccionarCategoria(tipo: string) {
    // console.log('categoría seleccionada:', tipo);
    this.categoriaActiva = tipo;
    // hide any open place detail when selecting a new category
    this.showPlaceDetail = false;
    this.showCategories = true;
    this.cdr.markForCheck(); // Force change detection
    // recenter map when searching
    if (this.map) {
      const center = new google.maps.LatLng(this.lat, this.lng);
      this.map.setCenter(center);
    }
    this.buscarLugares(tipo.toLowerCase());
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
        },
        () => this.cargarMapa()
      );
    } else {
      this.cargarMapa();
    }
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
      disableDefaultUI: false
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

  buscarLugares(tipo: string) {
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
      estética: 'beauty_salon',
      estetica: 'beauty_salon',
      abarrotes: 'grocery_or_supermarket',
      farmacias: 'pharmacy',
      farmacia: 'pharmacy',
      gym: 'gym',
      florería: 'florist',
      floreria: 'florist',
      boutique: 'clothing_store',
      papelerías: 'book_store',
      papelerias: 'book_store',
      veterinarias: 'veterinary_care'
    };
    const tipoNormalizado = this.normalizeCategoryName(tipo);
    const request: google.maps.places.PlaceSearchRequest = {
      location: { lat: this.lat, lng: this.lng },
      radius: 2000,
      type: mapping[tipo] || mapping[tipoNormalizado] || 'store'
    };
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
            console.log('📌 details.name =', (details as any).name);
          } else {
            this.selectedPlace = place;
            this.placeDisplayName = place.name || '';
            this.placeDisplayAddress = (place.vicinity || place.name || '') as string;
            console.log('ℹ️ Usando objeto place (sin details completos):', place.name);
          }
          // Actualizar vistas inmediatamente para evitar estado desincronizado
          this.showPlaceDetail = true;
          this.showCategories = false;
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
      this.showPlaceDetail = true;
      this.showCategories = false;
      this.cdr.markForCheck(); // Force change detection
      console.log('✅ Sin place_id. showPlaceDetail=true, showCategories=false');
    }
  }

  showNegocioDetail(biz: Negocio) {
    console.log('✅ Negocio clickeado:', biz.nombre_empresa);
    this.selectedPlace = null;
    this.selectedBiz = biz;
    this.placeDisplayName = biz.nombre_empresa || '';
    this.placeDisplayAddress = biz.direccion_empresa || '';
    this.showPlaceDetail = true;
    this.showCategories = false;
    try {
      this.cdr.detectChanges();
    } catch (e) {
      this.cdr.markForCheck();
    }
    console.log('✅ showPlaceDetail=true, showCategories=false');
  }

  backToCategories() {
    this.showPlaceDetail = false;
    this.showCategories = true;
    this.selectedPlace = null;
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
    const keys = this.getOpinionFetchKeys();
    if (!keys.length) {
      this.placeReviews = [];
      return;
    }

    forkJoin(
      keys.map((k) => this.opinionService.getOpinions(k).pipe(catchError(() => of([]))))
    ).subscribe({
      next: (groups) => {
        const merged = (groups || []).flat();
        const dedup = new Map<string, any>();
        merged.forEach((item: any) => {
          const key = String(item.id ?? '') + '|' + String(item.usuarioId ?? '') + '|' + String(item.texto ?? '');
          if (!dedup.has(key)) dedup.set(key, item);
        });

        this.placeReviews = Array.from(dedup.values()).map(op => ({
          userName: op.usuarioNombre || 'Usuario anónimo',
          rating: op.calificacion,
          text: op.texto,
          timestamp: op.fechaCreacion
        }));
      },
      error: err => {
        console.warn('Error cargando opiniones', err);
        this.placeReviews = [];
      }
    });
  }

  closeReviewsModal() {
    this.showReviewsModal = false;
  }

  submitReview() {
    if (!this.newReview.text.trim()) {
      alert('Por favor escribe una opinión.');
      return;
    }

    if (!this.usuarioId) {
      alert('Debes estar logueado para enviar una opinión.');
      return;
    }

    const lugarId = this.getOpinionSaveKey();
    if (!lugarId) {
      alert('No se pudo identificar el lugar.');
      return;
    }

    const opinion = {
      lugarId: lugarId,
      calificacion: this.newReview.rating,
      texto: this.newReview.text.trim()
    };

    this.opinionService.saveOpinion(opinion, this.usuarioId).subscribe({
      next: saved => {
        // prepend to list so it appears immediately
        this.placeReviews.unshift({
          userName: this.nombreDisplay || 'Usuario',
          rating: saved.calificacion,
          text: saved.texto,
          timestamp: saved.fechaCreacion
        });
        this.newReview = { rating: 5, text: '' };
        alert('¡Gracias por tu opinión!');
      },
      error: err => {
        console.error('Error guardando opinión', err);
        alert('Error al guardar la opinión. Inténtalo de nuevo.');
      }
    });
  }
}
