import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private API_URL = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  login(datos: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, datos);
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
}