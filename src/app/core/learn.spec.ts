import { allAnswered, categoriesOf, categoryKey, categoryLabelKey, filterItems, learnIcon, paragraphs, setFavorite } from './learn';
import { LearnItem } from './models';

const item = (id: number, tipo: string, categoria: string, extra: Partial<LearnItem> = {}): LearnItem => ({
  idMicroleccion: id, titulo: 'T' + id, descripcion: '', categoria, tipo, minutosLectura: 1, preguntas: 0,
  puntosRecompensa: 0, bloqueado: false, condicion: null, favorito: false, aprobado: false, mejorPuntaje: null, ...extra,
});

describe('learn section', () => {
  const items = [
    item(1, 'leccion', 'Ahorro'),
    item(2, 'tip', 'ahorro', { favorito: true }),
    item(3, 'leccion', 'Inversión'),
    item(4, 'tip', 'Criptos'),
  ];

  it('treats the same category with or without accents and capitals as one', () => {
    expect(categoryKey('Inversión')).toBe('inversion');
    expect(categoriesOf(items)).toEqual(['Ahorro', 'Criptos', 'Inversión']);
    expect(categoryLabelKey('Inversión')).toBe('learn.category.inversion');
    expect(categoryLabelKey('Criptos')).toBeNull();
  });

  it('filters by tab and category (US31, US32)', () => {
    expect(filterItems(items, 'all', 'AHORRO').map((i) => i.idMicroleccion)).toEqual([1, 2]);
    expect(filterItems(items, 'lessons', null).map((i) => i.idMicroleccion)).toEqual([1, 3]);
    expect(filterItems(items, 'tips', null).map((i) => i.idMicroleccion)).toEqual([2, 4]);
    expect(filterItems(items, 'favorites', null).map((i) => i.idMicroleccion)).toEqual([2]);
  });

  it('waits for every answer before sending the quiz (US35)', () => {
    const questions = [
      { idPregunta: 7, enunciado: '?', opciones: [] },
      { idPregunta: 8, enunciado: '?', opciones: [] },
    ];
    expect(allAnswered(questions, { 7: 'a' })).toBe(false);
    expect(allAnswered(questions, { 7: 'a', 8: 'b' })).toBe(true);
    expect(allAnswered([], {})).toBe(false);
  });

  it('splits the content in paragraphs and updates favorites at once', () => {
    expect(paragraphs('Uno.\n\nDos\nsigue.\n\n  \n')).toEqual(['Uno.', 'Dos\nsigue.']);
    expect(setFavorite(items, 1, true)[0].favorito).toBe(true);
    expect(learnIcon({ tipo: 'leccion', bloqueado: true })).toBe('lock');
    expect(learnIcon({ tipo: 'tip', bloqueado: false })).toBe('lightbulb');
  });
});
