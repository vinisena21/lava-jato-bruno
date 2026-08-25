import React from 'react';
import { CategoriaVeiculo, type Veiculo, type RoleUsuario } from '../types';

interface ListaProps {
  veiculos: Veiculo[];
  onTogglePagamento: (id: string, statusAtual: boolean) => void;
  onExcluirVeiculo: (id: string) => void;
  userRole: RoleUsuario;
}

export function ListaVeiculos({ veiculos, onTogglePagamento, onExcluirVeiculo, userRole }: ListaProps) {
  if (veiculos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 20px', backgroundColor: '#ffffff', borderRadius: '20px', color: '#94a3b8', border: '2px dashed #e2e8f0' }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Nenhum veículo no pátio no momento.</p>
      </div>
    );
  }

  const getCategoriaBadge = (cat: CategoriaVeiculo) => {
    switch (cat) {
      case CategoriaVeiculo.CARRO: return { bg: '#e0f2fe', color: '#0369a1', icon: '🚗' };
      case CategoriaVeiculo.CAMINHONETE: return { bg: '#fef3c7', color: '#b45309', icon: '🛻' };
      case CategoriaVeiculo.VAN: return { bg: '#f3e8ff', color: '#6b21a8', icon: '🚐' };
      case CategoriaVeiculo.MOTO: return { bg: '#dcfce7', color: '#15803d', icon: '🏍️' };
      default: return { bg: '#f1f5f9', color: '#334155', icon: '🚘' };
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
      {veiculos.map((v) => {
        const badge = getCategoriaBadge(v.categoria || CategoriaVeiculo.CARRO);
        return (
          <div
            key={v.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Indicador de Status lateral */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '6px',
              backgroundColor: v.pago ? '#10b981' : '#f43f5e',
            }} />

            <div style={{ paddingLeft: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{v.modelo}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {v.cor && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                        🎨 {v.cor}
                      </span>
                    )}
                    
                    {/* Exibe o Lavador (mesmo se for BRUNO ou não informado) */}
                    <span style={{ fontSize: '11px', fontWeight: '700', color: v.lavador ? '#2563eb' : '#94a3b8', backgroundColor: v.lavador ? '#eff6ff' : '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      👤 Lavador: {v.lavador || 'Não informado'}
                    </span>

                    {v.e_contrato && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', backgroundColor: '#fffbeb', padding: '2px 8px', borderRadius: '6px' }}>
                        📑 Contrato: {v.empresa_contrato || 'Sim'}
                      </span>
                    )}
                  </div>
                </div>

                <span style={{
                  backgroundColor: badge.bg,
                  color: badge.color,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  {badge.icon} {v.categoria || 'Carro'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Valor do serviço</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                  R$ {Number(v.valor).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', paddingLeft: '8px' }}>
              <button
                onClick={() => v.id && onTogglePagamento(v.id, v.pago)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: v.pago ? '#d1fae5' : '#ffe4e6',
                  color: v.pago ? '#047857' : '#e11d48',
                }}
              >
                {v.pago ? '✓ Pago' : '⏳ Marcar Pago'}
              </button>

              {userRole === 'dono' && (
                <button
                  onClick={() => {
                    if (v.id && window.confirm(`Deseja dar baixa no veículo ${v.modelo}?`)) {
                      onExcluirVeiculo(v.id);
                    }
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                  }}
                  title="Dar Baixa e Remover do Pátio"
                >
                  🗑️ Baixa
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}