import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sucursal } from '../model/sucursal';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private apiUrl = 'http://localhost:8080/api/sucursales';

  constructor(private http: HttpClient) {}

  getSucursalesByNegocio(idNegocio: number): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.apiUrl}/negocio/${idNegocio}`);
  }

  crearSucursal(payload: Sucursal): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.apiUrl, payload);
  }
}
