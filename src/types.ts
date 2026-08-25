export enum CategoriaVeiculo {
  CARRO = 'Carro',
  CAMINHONETE = 'Caminhonete',
  VAN = 'Van',
  MOTO = 'Moto'
}

export type Veiculo = {
  id?: string;
  placa?: string;
  modelo: string;
  cor?: string;
  categoria: CategoriaVeiculo;
  valor: number;
  pago: boolean;
  e_contrato?: boolean;
  empresa_contrato?: string;
  lavador?: string;
  criado_por?: string;
  created_at?: string;
};

export type Despesa = {
  id?: string;
  descricao: string;
  valor: number;
  tipo: 'dispensa' | 'funcionario' | 'pessoal';
  funcionario?: string; // NOVO: Nome do funcionário associado
  criado_por?: string;
  created_at?: string;
};

export type RoleUsuario = 'dono' | 'funcionario';