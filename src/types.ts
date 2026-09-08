export enum CategoriaVeiculo {
  CARRO = 'Carro',
  CAMINHONETE = 'Caminhonete',
  VAN = 'Van',
  MOTO = 'Moto',
}

export type RoleUsuario = 'dono' | 'gerente' | 'funcionario';

export interface Veiculo {
  id?: string;
  placa?: string;
  modelo: string;
  cor?: string;
  categoria?: CategoriaVeiculo;
  valor: number;
  pago: boolean;
  e_contrato?: boolean;
  empresa_contrato?: string;
  lavador?: string;
  criado_por?: string; // <--- NOVO CAMPO
  fechado?: boolean;
  created_at?: string;
}

export interface Despesa {
  id?: string;
  descricao: string;
  valor: number;
  tipo: 'dispensa' | 'funcionario' | 'pessoal';
  funcionario?: string;
  fechado?: boolean;
  created_at?: string;
}