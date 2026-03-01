import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NegocioService {
  // Asegúrate de que esta URL sea exactamente la que responde tu backend
  private apiUrl = 'http://localhost:8080/api/negocios';

  constructor(private http: HttpClient) { }

  getNegociosByUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  registrarNegocio(negocio: any, archivo?: File, archivoIne?: File): Observable<any> {
    const formData = new FormData();
    
    formData.append('negocio', new Blob([JSON.stringify(negocio)], {
      type: 'application/json'
    }));

    if (archivo) {
      formData.append('archivo', archivo);
    }

    if (archivoIne) {
      formData.append('archivoIne', archivoIne);
    }

    return this.http.post<any>(this.apiUrl, formData);
  }

  deleteNegocio(id: number): Observable<any> {
    // Esta línea debe llamar a http://localhost:8080/api/negocios/{id}
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

actualizarNegocio(id: number, negocio: any, archivo?: File, archivoIne?: File): Observable<any> {
    const formData = new FormData();
    
    formData.append('negocio', new Blob([JSON.stringify(negocio)], {
        type: 'application/json'
    }));

    if (archivo) formData.append('archivo', archivo);
    if (archivoIne) formData.append('archivoIne', archivoIne);

    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
}
  
} 