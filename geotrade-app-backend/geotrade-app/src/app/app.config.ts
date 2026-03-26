import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // 1. Agrega esta importación
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';




export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(), // 2. Agrega esta función aquí
    provideAnimations()
  ]
};

