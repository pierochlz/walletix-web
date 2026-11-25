// Interfaces that mirror the DTOs of the Walletix API (same field names as the JSON)

export interface User {
  idUsuario: number;
  nombreUsuario: string;
  correoUsuario: string;
  contrasenaUsuario?: string; // only sent when registering
  telefonoUsuario: number;
  fechaNacimientoUsuario: string; // yyyy-MM-dd
  segmentoUsuario: string;
  saldoActualUsuario: number;
  puntosGamificacionUsuario: number;
  estadoUsuario?: number;
}

export interface Expense {
  idGasto: number;
  idUsuario: number;
  idCategoria: number;
  idComerciante: number;
  descripcionGasto: string;
  montoGasto: number;
  fechaGasto: string;
  metodoPagoGasto: string;
  fijoGasto: boolean;
  alertaPresupuesto?: string; // US15: only in the response when the expense goes over the monthly budget
  avisoReto?: string; // only in the response when the expense breaks a challenge in progress (that day is lost)
}

export interface Income {
  idIngreso: number;
  monto: number;
  fecha: string;
  tipoIngreso: string;
  frecuencia: string;
  fuente: string;
  descripcion: string;
  idUsuario: number;
  idCategoria: number;
}

export interface SavingGoal {
  idMetaAhorro: number;
  titulo: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string;
  estadoMetaAhorro: string;
  idUsuario: number;
}

export interface Budget {
  idPresupuesto: number;
  mes: number;
  anio: number;
  montoAsignado: number;
  idUsuario: number;
  idCategoria: number;
  estado?: number; // 1 = active (default in the API)
}

export interface Category {
  idCategoria: number;
  idUsuario: number;
  nombreCategoria: string;
  tipoCategoria: 'gasto' | 'ingreso';
  urlIconoCategoria: string;
  colorHexCategoria: string;
  predeterminadoCategoria: boolean;
}

export interface Merchant {
  idComerciante: number;
  idCategoria: number;
  nombreComerciante: string;
  urlLogoComerciante?: string; // optional: the API saves a default one
  idUsuario?: number | null; // null = default merchant (everyone sees it); otherwise, the owner's id
  predeterminadoComerciante?: boolean;
}

// Notification of the panel (US22-US24). estadoNotificacion: true = read
export interface AppNotification {
  idNotificacion: number;
  idUsuario: number;
  titulo: string;
  tipo: string; // alerta, logro, reto...
  mensaje: string;
  estadoNotificacion: boolean;
  fechaNotificacion: string | null; // Peru's local time; null in old notifications
}

// ---- Challenges and achievements center (US26-US30) ----

export type ChallengeState = 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO' | 'ABANDONADO';

// A challenge the user is in ("Day 5 of 7")
export interface Participation {
  idUsuarioDesafio: number;
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipo: string | null;
  oficial: boolean;
  diaActual: number;
  duracionDias: number;
  porcentaje: number;
  ahorroEstimado: number;
  montoObjetivo: number;
  puntosRecompensa: number;
  estadoDesafio: ChallengeState;
  registradoHoy: boolean;
  fechaFin: string;
  diasRestantes: number;
}

// Top of the center: level, effectiveness, protected money and streak
export interface ChallengeSummary {
  nivel: number;
  nombreNivel: string;
  xp: number;
  xpInicioNivel: number;
  xpSiguienteNivel: number | null;
  retosSuperados: number;
  retosTotales: number;
  dineroBlindado: number;
  racha: number;
  activos: Participation[];
  historial: Participation[];
}

// Official challenge with the requirements the user is missing (US27, US28)
export interface AvailableChallenge {
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipo: string | null;
  montoObjetivo: number;
  puntosRecompensa: number;
  duracionDias: number;
  fechaInicio: string;
  fechaFin: string;
  edadMinima: number;
  participantes: number;
  puedeUnirse: boolean;
  requisitosFaltantes: string[];
}

// Answer of "Register today's progress"
export interface ProgressResult {
  xpGanado: number;
  diaActual: number;
  duracionDias: number;
  completado: boolean;
  puntosRecompensa: number;
  logrosDesbloqueados: string[];
}

// Medal of the showcase (US30)
export interface Medal {
  idLogro: number;
  nombre: string;
  descripcion: string;
  puntos: number;
  desbloqueada: boolean;
  avanceActual: number | null;
  avanceMeta: number | null;
}

// "Create a new challenge" form (US29)
export interface PersonalChallenge {
  tipo: string;
  titulo?: string | null;
  duracionDias: number;
  montoObjetivo: number;
}

// Body of POST /login and its response
export interface LoginRequest {
  correo: string;
  contrasena: string;
}
export interface LoginResponse {
  token: string;
}
