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

// Body of POST /login and its response
export interface LoginRequest {
  correo: string;
  contrasena: string;
}
export interface LoginResponse {
  token: string;
}
