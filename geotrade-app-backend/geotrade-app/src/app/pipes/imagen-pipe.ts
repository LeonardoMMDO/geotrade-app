import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'imagenUrl'
})
export class ImagenUrlPipe implements PipeTransform {
  transform(rutaOriginal: string | undefined | null): string {
    if (!rutaOriginal) return 'assets/recursos/no-image.png';

    // Si la ruta contiene localhost, la reemplazamos por la URL de Render
    if (rutaOriginal.includes('localhost:8080')) {
      const baseUrl = environment.apiUrl.replace('/api', ''); 
      return rutaOriginal.replace('http://localhost:8080', baseUrl);
    }
    
    return rutaOriginal;
  }
}