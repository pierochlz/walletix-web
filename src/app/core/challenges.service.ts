import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AvailableChallenge, ChallengeSummary, Medal, Participation, PersonalChallenge, ProgressResult } from './models';

// Calls to /retos (Centro de Retos y Logros). Everything is of the logged-in user (the API reads the token).
@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/retos`;

  summary(): Observable<ChallengeSummary> {
    return this.http.get<ChallengeSummary>(`${this.url}/resumen`);
  }

  available(): Observable<AvailableChallenge[]> {
    return this.http.get<AvailableChallenge[]>(`${this.url}/disponibles`);
  }

  medals(): Observable<Medal[]> {
    return this.http.get<Medal[]>(`${this.url}/medallas`);
  }

  join(idDesafio: number): Observable<Participation> {
    return this.http.post<Participation>(`${this.url}/${idDesafio}/unirme`, null);
  }

  registerProgress(idUsuarioDesafio: number): Observable<ProgressResult> {
    return this.http.post<ProgressResult>(`${this.url}/participaciones/${idUsuarioDesafio}/progreso`, null);
  }

  abandon(idUsuarioDesafio: number): Observable<Participation> {
    return this.http.put<Participation>(`${this.url}/participaciones/${idUsuarioDesafio}/abandonar`, null);
  }

  createPersonal(challenge: PersonalChallenge): Observable<Participation> {
    return this.http.post<Participation>(`${this.url}/personal`, challenge);
  }
}
