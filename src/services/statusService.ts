import api from './api';

export interface MissaoStatus {
  totalSensores: number;
  sensoresAtivos: number;
  totalEventos: number;
  eventosAbertos: number;
  totalAlertas: number;
  alertasCriticos: number;
  alertasAbertos: number;
  saudeGeral: number;
}

export async function buscarStatus(): Promise<MissaoStatus> {
  const response = await api.get<MissaoStatus>('/status');
  return response.data;
}
