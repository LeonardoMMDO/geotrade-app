import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private API_URL =  environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(datos: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, datos);
  }

  getUsuariosDebug(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/Lista-debug`);
  }

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/registrar`, usuario);
  }

  actualizarUsuario(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.API_URL}/actualizar/${id}`, datos);
  }

  enviarCodigoRecuperacion(contacto: string, metodo: string, codigo: string): Observable<any> {
    return this.http.post(`${this.API_URL}/enviar-codigo`, { contacto, metodo, codigo });
  }

  actualizarPasswordPorContacto(contacto: string, nuevaPassword: string): Observable<any> {
    return this.http.put(`${this.API_URL}/actualizar-password`, { contacto, nuevaPassword });
  }

  actualizarEstadoCuenta(id: number, activa: boolean): Observable<any> {
  return this.http.patch(`${this.API_URL}/${id}/activa`, { activa });
}

verificarCorreo(correo: string): Observable<any> {
  return this.http.get<any>(`${this.API_URL}/existe-correo?correo=${encodeURIComponent(correo)}`);
}

}