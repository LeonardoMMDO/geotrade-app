import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private apiKey = environment.googleMapsApiKey || '';
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    // si ya se está cargando, reutiliza la promesa
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // ya cargado?
      if (window && (window as any).google && (window as any).google.maps) {
        console.log('Google Maps API ya está cargada');
        resolve();
        return;
      }

      // callback único para resolver la promesa
      const callbackName = '_geotradeMapReady';
      (window as any)[callbackName] = () => {
        console.log('Google Maps API callback ejecutado');
        resolve();
      };

      // crea script con async (no defer para carga dinámica)
      const script = document.createElement('script');
      // add loading=async query param to follow Google best-practice
      // (warning appears even when script.async=true)
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.onerror = (err) => {
        reject(err);
      };
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
