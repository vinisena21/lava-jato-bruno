import React from 'react';

interface FiltroProps {
  termo: string;
  onTermoChange: (novoTermo: string) => void;
}

export function FiltroVeiculos({ termo, onTermoChange }: FiltroProps) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        color: '#94a3b8',
        pointerEvents: 'none'
      }}>
        🔍
      </span>

      <input
        type="text"
        placeholder="Buscar por placa, modelo ou cor..."
        value={termo}
        onChange={(e) => onTermoChange(e.target.value)}
        style={{
          width: '100%',
          padding: '13px 16px 13px 44px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          fontSize: '14px',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
        }}
      />
    </div>
  );
}