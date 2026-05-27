import api from './api';
import { Sensor } from '../types/sensor';

export async function listarSensores(): Promise<Sensor[]> {
  const response = await api.get<Sensor[]>('/sensores');
  return response.data;
}

export async function buscarSensorPorId(id: number): Promise<Sensor> {
  const response = await api.get<Sensor>(`/sensores/${id}`);
  return response.data;
}

export async function criarSensor(sensor: Omit<Sensor, 'id'>): Promise<Sensor> {
  const response = await api.post<Sensor>('/sensores', sensor);
  return response.data;
}

export async function atualizarSensor(id: number, sensor: Omit<Sensor, 'id'>): Promise<Sensor> {
  const response = await api.put<Sensor>(`/sensores/${id}`, sensor);
  return response.data;
}

export async function deletarSensor(id: number): Promise<void> {
  await api.delete(`/sensores/${id}`);
}
