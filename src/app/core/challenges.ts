import { ChallengeSummary, Medal, Participation, ProgressResult } from './models';

// Pure logic of the challenges center (no Angular), so it can be unit tested.

// Types of challenge (same keys as the API) and their icon
export const CHALLENGE_TYPES = ['sin_delivery', 'sin_gastos_hormiga', 'sin_compras_impulsivas', 'transporte_inteligente', 'ahorro_libre'];

export function challengeIcon(type: string | null | undefined): string {
  switch (type) {
    case 'sin_delivery':
      return 'delivery_dining';
    case 'sin_gastos_hormiga':
      return 'bug_report';
    case 'sin_compras_impulsivas':
      return 'shopping_bag';
    case 'transporte_inteligente':
      return 'directions_bus';
    case 'ahorro_libre':
      return 'savings';
    default:
      return 'flag';
  }
}

// Percentage of the XP bar inside the current level ("130 / 250 XP")
export function levelProgress(summary: Pick<ChallengeSummary, 'xp' | 'xpInicioNivel' | 'xpSiguienteNivel'>): number {
  if (summary.xpSiguienteNivel === null) return 100; // last level
  const range = summary.xpSiguienteNivel - summary.xpInicioNivel;
  return Math.max(0, Math.min(100, Math.round(((summary.xp - summary.xpInicioNivel) / range) * 100)));
}

// Percentage of a locked medal ("4 / 7")
export function medalProgress(medal: Medal): number | null {
  if (medal.avanceActual === null || medal.avanceMeta === null || medal.avanceMeta === 0) return null;
  return Math.min(100, Math.round((medal.avanceActual / medal.avanceMeta) * 100));
}

// US30: text shared on social networks (the landing page explains Walletix)
export const SHARE_URL = 'https://pierochlz.github.io/walletix-landing/';

export function shareText(medalName: string, lang: 'es' | 'en'): string {
  return lang === 'es'
    ? `¡Desbloqueé la medalla «${medalName}» en Walletix! 🏅 Ahorro con retos y aprendo finanzas.`
    : `I unlocked the "${medalName}" medal on Walletix! 🏅 I save with challenges and learn about money.`;
}

// Links to share in each social network
export function shareLinks(text: string, url: string = SHARE_URL): { network: string; icon: string; href: string }[] {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return [
    { network: 'WhatsApp', icon: 'chat', href: `https://wa.me/?text=${t}%20${u}` },
    { network: 'X', icon: 'alternate_email', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { network: 'Facebook', icon: 'thumb_up', href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
  ];
}

// ---- Instant updates: the screen changes with the API answer, without waiting for the full reload ----
// (in production the full reload takes a few seconds; the rest of the data is refreshed in the background)

// After "Register today's progress"
export function applyProgress(summary: ChallengeSummary, idUsuarioDesafio: number, result: ProgressResult): ChallengeSummary {
  const current = summary.activos.find((p) => p.idUsuarioDesafio === idUsuarioDesafio);
  if (!current) return summary;
  const updated: Participation = {
    ...current,
    diaActual: result.diaActual,
    porcentaje: Math.min(100, Math.round((result.diaActual / result.duracionDias) * 100)),
    ahorroEstimado: Math.round(((current.montoObjetivo * Math.min(result.diaActual, result.duracionDias)) / result.duracionDias) * 100) / 100,
    registradoHoy: true,
    estadoDesafio: result.completado ? 'COMPLETADO' : current.estadoDesafio,
  };
  const others = summary.activos.filter((p) => p.idUsuarioDesafio !== idUsuarioDesafio);
  return {
    ...summary,
    xp: summary.xp + result.xpGanado + result.puntosRecompensa,
    activos: result.completado ? others : summary.activos.map((p) => (p.idUsuarioDesafio === idUsuarioDesafio ? updated : p)),
    historial: result.completado ? [updated, ...summary.historial] : summary.historial,
    retosSuperados: summary.retosSuperados + (result.completado ? 1 : 0),
    dineroBlindado: summary.dineroBlindado + (result.completado ? current.montoObjetivo : 0),
  };
}

// After joining a challenge or creating a personal one
export function addActive(summary: ChallengeSummary, participation: Participation): ChallengeSummary {
  return { ...summary, activos: [participation, ...summary.activos], retosTotales: summary.retosTotales + 1 };
}

// After abandoning: the challenge goes to the history
export function moveToHistory(summary: ChallengeSummary, participation: Participation): ChallengeSummary {
  return {
    ...summary,
    activos: summary.activos.filter((p) => p.idUsuarioDesafio !== participation.idUsuarioDesafio),
    historial: [participation, ...summary.historial],
  };
}
