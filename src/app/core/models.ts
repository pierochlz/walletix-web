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
  urlLogoComerciante: string;
}

// Body of POST /login and its response
export interface LoginRequest {
  correo: string;
  contrasena: string;
}
export interface LoginResponse {
  token: string;
}
