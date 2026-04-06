import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class NegocioService {
  private apiUrl = `${environment.apiUrl}/negocios`;

  constructor(private http: HttpClient) { }

  getNegociosByUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  getNegociosPublicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicos`);
  }

  registrarNegocio(negocio: any, archivoLogo?: File, archivosFotos?: File[], archivosIne?: File[]): Observable<any> {
    const formData = new FormData();

    formData.append('negocio', new Blob([JSON.stringify(negocio)], {
      type: 'application/json'
    }));

    if (archivoLogo) {
      formData.append('archivoLogo', archivoLogo);
    }

    if (archivosFotos && archivosFotos.length) {
      archivosFotos.forEach((f) => formData.append('archivos', f));
    }

    if (archivosIne && archivosIne.length) {
      archivosIne.forEach((f) => formData.append('archivosIne', f));
    }

    return this.http.post<any>(this.apiUrl, formData);
  }

  deleteNegocio(id: number): Observable<any> {
    // Esta línea debe llamar a http://localhost:8080/api/negocios/{id}
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

actualizarNegocio(id: number, negocio: any, archivoLogo?: File, archivosFotos?: File[], archivosIne?: File[]): Observable<any> {
    const formData = new FormData();
    
    formData.append('negocio', new Blob([JSON.stringify(negocio)], {
        type: 'application/json'
    }));

    if (archivoLogo) {
      formData.append('archivoLogo', archivoLogo);
    }

    if (archivosFotos && archivosFotos.length) {
      archivosFotos.forEach(f => formData.append('archivos', f));
    }

    if (archivosIne && archivosIne.length) {
      archivosIne.forEach(f => formData.append('archivosIne', f));
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
}

actualizarEstadoNegocio(id: number, activo: boolean): Observable<any> {
  return this.http.patch<any>(`${this.apiUrl}/${id}/activo`, { activo });
}

getNegociosConSucursales(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/publicos/con-sucursales`);
}

} 