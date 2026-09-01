export interface SugerenciaProgramadaPayload {
  sugerenciaId: string;
  titulo: string;
  contacto: string;
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
  sendReservaConfirmada(payload: ReservaConfirmadaPayload): Promise<void>;
}
