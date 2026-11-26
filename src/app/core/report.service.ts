import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// US39: my financial report in PDF. The API builds the file; the browser only downloads it.
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/reportes/pdf`;

  // from / to: "yyyy-MM"
  pdf(from: string, to: string): Observable<Blob> {
    return this.http.get(this.url, { params: new HttpParams().set('desde', from).set('hasta', to), responseType: 'blob' });
  }
}

// "walletix-reporte-2026-09_2026-11.pdf" (the same name the API sends)
export function reportFileName(from: string, to: string): string {
  return `walletix-reporte-${from}${from === to ? '' : '_' + to}.pdf`;
}

// Saves the file in the user's downloads
export function saveFile(file: Blob, name: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// With responseType 'blob' the API error ("no hay información para exportar") also arrives as a Blob
export async function blobErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof HttpErrorResponse) {
    if (error.error instanceof Blob) {
      const text = (await error.error.text()).trim();
      if (text && !text.startsWith('<')) return text;
    }
    if (error.status === 0) return fallback;
  }
  return fallback;
}
