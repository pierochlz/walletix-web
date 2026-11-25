import { LearnItem, QuizQuestion } from './models';

// Pure helpers of the Learn section (easy to unit test)

export type LearnTab = 'all' | 'lessons' | 'tips' | 'favorites';

// "Inversión" -> "inversion": the same category with or without accents / capitals
export function categoryKey(category: string | null | undefined): string {
  return (category ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

// Known categories have a translated name; any other one keeps the name the admin wrote
const KNOWN = ['ahorro', 'presupuesto', 'credito', 'deudas', 'inversion', 'habitos'];
export function categoryLabelKey(category: string): string | null {
  const key = categoryKey(category);
  return KNOWN.includes(key) ? 'learn.category.' + key : null;
}

// Categories that have content, without repeating "Ahorro" and "ahorro"
export function categoriesOf(items: LearnItem[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = categoryKey(item.categoria);
    if (key && !seen.has(key)) seen.set(key, item.categoria);
  }
  return [...seen.values()].sort((a, b) => categoryKey(a).localeCompare(categoryKey(b)));
}

export function filterItems(items: LearnItem[], tab: LearnTab, category: string | null): LearnItem[] {
  return items.filter((item) => {
    if (category && categoryKey(item.categoria) !== categoryKey(category)) return false;
    if (tab === 'lessons') return item.tipo === 'leccion';
    if (tab === 'tips') return item.tipo === 'tip';
    if (tab === 'favorites') return item.favorito;
    return true;
  });
}

// US35: "Given que respondo TODAS las preguntas del quiz" -> the send button waits for every answer
export function allAnswered(questions: QuizQuestion[], answers: Record<number, string>): boolean {
  return questions.length > 0 && questions.every((q) => !!answers[q.idPregunta]);
}

// The content is plain text: a blank line starts a new paragraph
export function paragraphs(content: string | null | undefined): string[] {
  return (content ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// After a favorite toggle the list changes at once
export function setFavorite(items: LearnItem[], id: number, favorite: boolean): LearnItem[] {
  return items.map((item) => (item.idMicroleccion === id ? { ...item, favorito: favorite } : item));
}

export function learnIcon(item: Pick<LearnItem, 'tipo' | 'bloqueado'>): string {
  if (item.bloqueado) return 'lock';
  return item.tipo === 'tip' ? 'lightbulb' : 'menu_book';
}
