import api from './api';
import { EventoOperacional } from '../types/eventoOperacional';

export async function listarEventos(): Promise<EventoOperacional[]> {
  const response = await api.get<EventoOperacional[]>('/eventos');
  return response.data;
}

export async function buscarEventoPorId(id: number): Promise<EventoOperacional> {
  const response = await api.get<EventoOperacional>(`/eventos/${id}`);
  return response.data;
}

export async function criarEvento(evento: Omit<EventoOperacional, 'id'>): Promise<EventoOperacional> {
  const response = await api.post<EventoOperacional>('/eventos', evento);
  return response.data;
}

export async function atualizarEvento(id: number, evento: Omit<EventoOperacional, 'id'>): Promise<EventoOperacional> {
  const response = await api.put<EventoOperacional>(`/eventos/${id}`, evento);
  return response.data;
}

export async function deletarEvento(id: number): Promise<void> {
  await api.delete(`/eventos/${id}`);
}
