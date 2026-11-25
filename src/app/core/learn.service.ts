import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FavoriteResult, LearnDetail, LearnItem, QuizResult } from './models';

// Calls to /aprende (Learn section, US31-US35). Everything is of the logged-in user (the API reads the token).
@Injectable({ providedIn: 'root' })
export class LearnService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/aprende`;

  // US31 + US32 + US33: the search is done by the API (it also looks inside the content of the lessons)
  list(search = ''): Observable<LearnItem[]> {
    const params = search.trim() ? new HttpParams().set('buscar', search.trim()) : undefined;
    return this.http.get<LearnItem[]>(this.url, { params });
  }

  // US34 (403 with the unlock condition if it is locked, US33)
  open(id: number): Observable<LearnDetail> {
    return this.http.get<LearnDetail>(`${this.url}/${id}`);
  }

  // "Tip de 30 segundos" of the day (null when there are no tips)
  tipOfTheDay(): Observable<LearnDetail | null> {
    return this.http.get<LearnDetail | null>(`${this.url}/tip-del-dia`);
  }

  // US35: idPregunta -> chosen letter
  sendQuiz(id: number, respuestas: Record<number, string>): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.url}/${id}/quiz`, { respuestas });
  }

  // US32: each call adds or removes the favorite
  toggleFavorite(id: number): Observable<FavoriteResult> {
    return this.http.put<FavoriteResult>(`${this.url}/${id}/favorito`, null);
  }
}
