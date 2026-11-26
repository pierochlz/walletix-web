import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LessonPage } from './lesson';

// Found in the manual test: going from /learn/1 to /learn/4 without leaving the lesson page
// (Back / Forward) kept showing lesson 1, because the id was read only once.
describe('LessonPage', () => {
  it('loads the new lesson when only the id of the route changes', () => {
    const params = new BehaviorSubject<ParamMap>(convertToParamMap({ id: '1' }));
    TestBed.configureTestingModule({
      imports: [LessonPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LessonPage);
    fixture.detectChanges();

    const lesson = (id: number, titulo: string) => ({
      resumen: { idMicroleccion: id, titulo, tipo: 'leccion', categoria: 'ahorro', bloqueado: false, favorito: false },
      contenido: 'Texto',
      preguntas: [],
    });
    http.expectOne(`${environment.apiUrl}/aprende/1`).flush(lesson(1, 'La regla 50/30/20'));
    expect(fixture.componentInstance.detail()?.resumen.idMicroleccion).toBe(1);

    fixture.componentInstance.choose(7, 'b'); // an answer of lesson 1
    params.next(convertToParamMap({ id: '4' }));
    // While lesson 4 loads, nothing of lesson 1 is left on the screen
    expect(fixture.componentInstance.detail()).toBeNull();
    expect(fixture.componentInstance.answers()).toEqual({});
    http.expectOne(`${environment.apiUrl}/aprende/4`).flush(lesson(4, 'Metas SMART'));
    expect(fixture.componentInstance.detail()?.resumen.idMicroleccion).toBe(4);
    http.verify();
  });
});
