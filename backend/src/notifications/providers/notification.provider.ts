export interface SugerenciaProgramadaPayload {
  sugerenciaId: string;
  titulo: string;
  contacto: string;
}

export interface ReservaRegistradaPayload {
  reservaId: string;
  codigo: string;
  funcionId: string;
  pelicula: string;
  fechaHora: Date | string;
  cantidad: number;
  total: number;
  contacto: string;
  email?: string | null;
  expiraEn: Date | string;
}

export interface PagoConfirmadoPayload {
  reservaId: string;
  codigo: string;
  funcionId: string;
  pelicula: string;
  fechaHora: Date | string;
  cantidad: number;
  total: number;
  contacto: string;
  email?: string | null;
  confirmadoEn: Date | string;
}

export interface ReservaConfirmadaPayload {
  reservaId: string;
  funcionId: string;
  pelicula: string;
  fechaHora: Date | string;
  cantidad: number;
  contacto: string;
}

export interface NotificationProvider {
  readonly name: string;
  sendSugerenciaProgramada(payload: SugerenciaProgramadaPayload): Promise<void>;
  sendReservaRegistrada(payload: ReservaRegistradaPayload): Promise<void>;
  sendPagoConfirmado(payload: PagoConfirmadoPayload): Promise<void>;
  sendReservaConfirmada(payload: ReservaConfirmadaPayload): Promise<void>;
}
