import { ChallengeSummary, Medal } from './models';

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
