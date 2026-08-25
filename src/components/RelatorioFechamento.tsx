import React from 'react';
import { CategoriaVeiculo, type Veiculo } from '../types';

interface RelatorioProps {
  veiculos: Veiculo[];
}

export function RelatorioFechamento({ veiculos }: RelatorioProps) {
  const totalAtendimentos = veiculos.length;
  const recebidos = veiculos.filter((v) => v.pago);
  const pendentes = veiculos.filter((v) => !v.pago);

  const valorTotalGeral = veiculos.reduce((acc, v) => acc + Number(v.valor || 0), 0);
  const valorTotalRecebido = recebidos.reduce((acc, v) => acc + Number(v.valor || 0), 0);
  const valorTotalPendente = pendentes.reduce((acc, v) => acc + Number(v.valor || 0), 0);
  const ticketMedio = totalAtendimentos > 0 ? valorTotalGeral / totalAtendimentos : 0;

  const porCategoria = {
    [CategoriaVeiculo.CARRO]: veiculos.filter((v) => v.categoria === CategoriaVeiculo.CARRO).length,
    [CategoriaVeiculo.CAMINHONETE]: veiculos.filter((v) => v.categoria === CategoriaVeiculo.CAMINHONETE).length,
    [CategoriaVeiculo.VAN]: veiculos.filter((v) => v.categoria === CategoriaVeiculo.VAN).length,
    [CategoriaVeiculo.MOTO]: veiculos.filter((v) => v.categoria === CategoriaVeiculo.MOTO).length,
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '28px',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)',
      marginBottom: '28px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: '#eff6ff',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            📊
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Resumo Geral de Lavagens
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Métricas acumuladas</p>
          </div>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#2563eb',
          backgroundColor: '#eff6ff',
          padding: '6px 14px',
          borderRadius: '30px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block' }} />
          Painel do Dono
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        
        <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Atendimentos Total
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '6px 0 0 0' }}>
            {totalAtendimentos}
          </p>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', padding: '18px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recebido ({recebidos.length})
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#15803d', margin: '6px 0 0 0' }}>
            R$ {valorTotalRecebido.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div style={{ backgroundColor: '#fff1f2', padding: '18px', borderRadius: '16px', border: '1px solid #fecdd3' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            A Receber ({pendentes.length})
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#e11d48', margin: '6px 0 0 0' }}>
            R$ {valorTotalPendente.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ticket Médio
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '6px 0 0 0' }}>
            R$ {ticketMedio.toFixed(2).replace('.', ',')}
          </p>
        </div>

      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '20px', fontSize: '13px', color: '#475569', flexWrap: 'wrap' }}>
        <span>🚗 Carros: <strong style={{ color: '#0f172a' }}>{porCategoria[CategoriaVeiculo.CARRO] || 0}</strong></span>
        <span>🛻 Caminhonetes: <strong style={{ color: '#0f172a' }}>{porCategoria[CategoriaVeiculo.CAMINHONETE] || 0}</strong></span>
        <span>🚐 Vans: <strong style={{ color: '#0f172a' }}>{porCategoria[CategoriaVeiculo.VAN] || 0}</strong></span>
        <span>🏍️ Motos: <strong style={{ color: '#0f172a' }}>{porCategoria[CategoriaVeiculo.MOTO] || 0}</strong></span>
      </div>
    </div>
  );
}