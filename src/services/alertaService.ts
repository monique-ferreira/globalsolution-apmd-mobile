import api from './api';
import { AlertaCritico } from '../types/alertaCritico';

export async function listarAlertas(): Promise<AlertaCritico[]> {
  const response = await api.get<AlertaCritico[]>('/alertas');
  return response.data;
}

export async function buscarAlertaPorId(id: number): Promise<AlertaCritico> {
  const response = await api.get<AlertaCritico>(`/alertas/${id}`);
  return response.data;
}

export async function criarAlerta(alerta: Omit<AlertaCritico, 'id'>): Promise<AlertaCritico> {
  const response = await api.post<AlertaCritico>('/alertas', alerta);
  return response.data;
}

export async function atualizarAlerta(id: number, alerta: Omit<AlertaCritico, 'id'>): Promise<AlertaCritico> {
  const response = await api.put<AlertaCritico>(`/alertas/${id}`, alerta);
  return response.data;
}

export async function deletarAlerta(id: number): Promise<void> {
  await api.delete(`/alertas/${id}`);
}
