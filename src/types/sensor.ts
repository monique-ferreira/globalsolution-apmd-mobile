export interface Sensor {
  id: number;
  nome: string;
  tipo: string;
  status: string;
  leituraAtual: number;
  unidade: string;
  ativo: boolean;
}
