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
