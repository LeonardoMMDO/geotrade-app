import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpinionService {
  private apiUrl = `${environment.apiUrl}/opiniones`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene opiniones por lugarId.
   */
  getOpinions(lugarId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${lugarId}`);
  }

  getOpinionesPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Guarda una nueva opinión. El objeto debe contener {lugarId, calificacion, texto} y usuarioId como param.
   */
  saveOpinion(opinion: any, usuarioId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}?usuarioId=${usuarioId}`, opinion);
  }

  deleteOpinion(opinionId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${opinionId}?usuarioId=${usuarioId}`);
  }

  deleteOpinionFallback(opinionId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${opinionId}/eliminar?usuarioId=${usuarioId}`, {});
  }
}
