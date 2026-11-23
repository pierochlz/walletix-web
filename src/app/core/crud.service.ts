import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Base service: every Walletix resource uses the same routes
//   GET /resource, GET /resource/{id}, POST /resource/web, PUT /resource/actualiza, DELETE /resource/{id}
// Each concrete service only says which resource it is (gastos, ingresos, ...)
export abstract class CrudService<T> {
  protected http = inject(HttpClient);
  protected url: string;

  protected constructor(resource: string) {
    this.url = `${environment.apiUrl}/${resource}`;
  }

  list(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(item: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.url}/web`, item);
  }

  // PUT and DELETE answer with a plain text message, not JSON
  update(item: Partial<T>): Observable<string> {
    return this.http.put(`${this.url}/actualiza`, item, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' });
  }
}
