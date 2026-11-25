import { challengeIcon, levelProgress, medalProgress, shareLinks, shareText } from './challenges';
import { Medal } from './models';

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
