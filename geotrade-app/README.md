# GeotradeApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Google Maps API

The `ExploradorComponent` integrates the Google Maps JavaScript API and the Places library.

1. **API key** – provide your key in `src/environments/environment.ts` (and `environment.prod.ts` for production):

   ```ts
   export const environment = {
     production: false,
     googleMapsApiKey: 'YOUR_KEY_HERE'
   };
   ```

   > ⚠️ *Si ves en la consola un error `ApiTargetBlockedMapError`* significa que la clave tiene
   > restricciones (referer o IP) que no permiten su uso desde `localhost` o la URL actual.
   > Revisa la configuración en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   > y añade `http://localhost/*` (u otras direcciones) como referencias permitidas, o elimina las
   > restricciones mientras desarrollas.

2. **Script loading** – the app no longer includes a hard‑coded `<script>` tag in `index.html`. A `GoogleMapsLoaderService` dynamically injects the script at runtime using the value from the environment. It sets `async`, `defer` and `loading="lazy"` attributes for optimal performance.

3. **Usage** – the component waits for the loader, obtains the user's location, initializes the map inside a `#map` element and exposes a `buscarLugares` helper that performs nearby searches when a category is selected.

   **Map Interaction:**
   - A permanent **blue marker** shows your current location ("Tu ubicación actual").
   - Click any **sidebar category** (Restaurantes, Refaccionarias, Estética) to search nearby businesses.
   - The map auto-centers and displays matching service markers within 2&nbsp;km.
   - Previous markers are automatically cleared, so you only see the active category's results.
   - Open the **browser console** (F12) and check logs like `categoría seleccionada: Restaurantes` and `encontrados 15 lugares de tipo "restaurantes"` to track search progress.

See `src/app/components/explorador/explorador.ts` and `src/app/services/google-maps-loader.service.ts` for implementation details. The component uses the stable `google.maps.Marker` API and loads the Google Maps script with a callback pattern to ensure the API is ready before initialization.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
