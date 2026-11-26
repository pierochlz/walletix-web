import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { blobErrorMessage, reportFileName, ReportService } from './report.service';

describe('PDF report (US39)', () => {
  it('asks the API for the PDF of the chosen months', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(ReportService);
    const http = TestBed.inject(HttpTestingController);
    let received: Blob | undefined;
    service.pdf('2026-09', '2026-11').subscribe((file) => (received = file));
    const request = http.expectOne((r) => r.url === `${environment.apiUrl}/reportes/pdf`);
    expect(request.request.params.get('desde')).toBe('2026-09');
    expect(request.request.params.get('hasta')).toBe('2026-11');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
    expect(received?.type).toBe('application/pdf');
    http.verify();
  });

  it('names the file like the API', () => {
    expect(reportFileName('2026-11', '2026-11')).toBe('walletix-reporte-2026-11.pdf');
    expect(reportFileName('2026-09', '2026-11')).toBe('walletix-reporte-2026-09_2026-11.pdf');
  });

  it('reads the API message of an error that arrives as a file (US39 scenario 2)', async () => {
    const noData = new HttpErrorResponse({
      status: 404,
      error: new Blob(['No hay movimientos en el periodo elegido: no hay información para exportar'], { type: 'text/plain' }),
    });
    expect(await blobErrorMessage(noData, 'Error')).toContain('no hay información para exportar');
    expect(await blobErrorMessage(new HttpErrorResponse({ status: 0 }), 'Sin conexión')).toBe('Sin conexión');
    const html = new HttpErrorResponse({ status: 502, error: new Blob(['<html>Bad gateway</html>']) });
    expect(await blobErrorMessage(html, 'Error')).toBe('Error');
  });
});
