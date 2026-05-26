import axios from 'axios';

/**
 * BASE_URL aponta para o backend Spring Boot.
 *
 * - Expo Web / iOS Simulator → localhost funciona normalmente
 * - Android Emulator → use 10.0.2.2
 * - Dispositivo físico → use o IP da sua máquina (ex: 192.168.1.100)
 */
const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
