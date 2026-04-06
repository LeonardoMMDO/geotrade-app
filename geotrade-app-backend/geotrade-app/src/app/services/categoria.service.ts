import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, CategoriaPayload } from '../model/categoria';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CategoriaService {
    private readonly API_URL = `${environment.apiUrl}/categorias`;

    constructor(private http: HttpClient) { }

    getCategorias(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(this.API_URL);
    }

    crearCategoria(payload: CategoriaPayload): Observable<Categoria> {
        return this.http.post<Categoria>(this.API_URL, payload);
    }

    actualizarCategoria(id: number, payload: CategoriaPayload & { habilitada?: boolean }): Observable<Categoria> {
        return this.http.put<Categoria>(`${this.API_URL}/${id}`, payload);
    }

    actualizarEstadoCategoria(id: number, habilitada: boolean): Observable<Categoria> {
        return this.http.patch<Categoria>(`${this.API_URL}/${id}/habilitada`, { habilitada });
    }

    eliminarCategoria(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
