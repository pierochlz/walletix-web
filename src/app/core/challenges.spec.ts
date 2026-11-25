import { addActive, applyProgress, challengeIcon, expenseWarnings, levelProgress, medalProgress, moveToHistory, shareLinks, shareText, verificationKey } from './challenges';
import { ChallengeSummary, Medal, Participation } from './models';

const medal = (actual: number | null, meta: number | null): Medal => ({
  idLogro: 1, nombre: 'Constante', descripcion: '', puntos: 30, desbloqueada: false, avanceActual: actual, avanceMeta: meta,
});

describe('challenges center', () => {
  it('fills the XP bar inside the current level', () => {
    expect(levelProgress({ xp: 175, xpInicioNivel: 100, xpSiguienteNivel: 250 })).toBe(50);
    expect(levelProgress({ xp: 100, xpInicioNivel: 100, xpSiguienteNivel: 250 })).toBe(0);
    expect(levelProgress({ xp: 5000, xpInicioNivel: 4000, xpSiguienteNivel: null })).toBe(100); // last level
  });

  it('shows the progress of a locked medal, or nothing when it is not measured', () => {
    expect(medalProgress(medal(4, 7))).toBe(57);
    expect(medalProgress(medal(null, null))).toBeNull();
  });

  it('US30: builds the share text in both languages', () => {
    expect(shareText('Retador', 'es')).toContain('«Retador»');
    expect(shareText('Retador', 'en')).toContain('"Retador"');
  });

  it('US30: share links encode the text and point to the landing page', () => {
    const links = shareLinks('¡Hola mundo!');
    expect(links.map((l) => l.network)).toEqual(['WhatsApp', 'X', 'Facebook']);
    expect(links[0].href).toContain('%C2%A1Hola%20mundo!');
    expect(links[0].href).toContain(encodeURIComponent('https://pierochlz.github.io/walletix-landing/'));
  });

  it('uses an icon for each type of challenge', () => {
    expect(challengeIcon('sin_delivery')).toBe('delivery_dining');
    expect(challengeIcon(null)).toBe('flag');
  });
});

const participation = (id: number, dia: number, duracion: number): Participation => ({
  idUsuarioDesafio: id, idDesafio: id, titulo: 'R' + id, descripcion: '', tipo: null, oficial: true, diaActual: dia,
  duracionDias: duracion, porcentaje: 0, ahorroEstimado: 0, montoObjetivo: 70, puntosRecompensa: 50,
  estadoDesafio: 'EN_PROGRESO', registradoHoy: false, fechaFin: '2026-12-31', diasRestantes: 10,
});
const summary = (activos: Participation[]): ChallengeSummary => ({
  nivel: 1, nombreNivel: 'principiante', xp: 0, xpInicioNivel: 0, xpSiguienteNivel: 100, retosSuperados: 0,
  retosTotales: activos.length, dineroBlindado: 0, racha: 0, activos, historial: [],
});

describe('instant updates of the challenges center', () => {
  it('moves the day forward right after registering the progress', () => {
    const next = applyProgress(summary([participation(1, 4, 7)]), 1,
      { xpGanado: 20, diaActual: 5, duracionDias: 7, completado: false, puntosRecompensa: 0, logrosDesbloqueados: [] });
    expect(next.activos[0].diaActual).toBe(5);
    expect(next.activos[0].registradoHoy).toBe(true);
    expect(next.activos[0].porcentaje).toBe(71);
    expect(next.activos[0].ahorroEstimado).toBe(50);
    expect(next.xp).toBe(20);
  });

  it('on the last day the challenge goes to the history with its reward', () => {
    const next = applyProgress(summary([participation(1, 6, 7)]), 1,
      { xpGanado: 20, diaActual: 7, duracionDias: 7, completado: true, puntosRecompensa: 50, logrosDesbloqueados: [] });
    expect(next.activos).toEqual([]);
    expect(next.historial[0].estadoDesafio).toBe('COMPLETADO');
    expect(next.retosSuperados).toBe(1);
    expect(next.dineroBlindado).toBe(70);
    expect(next.xp).toBe(70);
  });

  it('adds a joined challenge and moves an abandoned one to the history', () => {
    const joined = addActive(summary([]), participation(2, 0, 5));
    expect(joined.activos.map((p) => p.idUsuarioDesafio)).toEqual([2]);
    expect(joined.retosTotales).toBe(1);
    const abandoned = moveToHistory(joined, { ...participation(2, 0, 5), estadoDesafio: 'ABANDONADO' });
    expect(abandoned.activos).toEqual([]);
    expect(abandoned.historial[0].estadoDesafio).toBe('ABANDONADO');
  });
});

describe('challenges verified with expenses', () => {
  it('says which challenges are checked with the expenses and which are honor-based', () => {
    expect(verificationKey('sin_delivery')).toBe('challenges.verified.sin_delivery');
    expect(verificationKey('sin_gastos_hormiga')).toBe('challenges.verified.sin_gastos_hormiga');
    expect(verificationKey('transporte_inteligente')).toBe('challenges.verified.transporte_inteligente');
    expect(verificationKey('ahorro_libre')).toBe('challenges.honor');
    expect(verificationKey(null)).toBe('challenges.honor');
  });

  it('joins the budget alert and the challenge warning of a saved expense', () => {
    expect(expenseWarnings(null)).toBeNull();
    expect(expenseWarnings({ alertaPresupuesto: 'Over budget' } as never)).toBe('Over budget');
    expect(expenseWarnings({ avisoReto: 'Lost a day' } as never)).toBe('Lost a day');
    expect(expenseWarnings({ alertaPresupuesto: 'Over budget', avisoReto: 'Lost a day' } as never)).toBe('Over budget · Lost a day');
  });
});
