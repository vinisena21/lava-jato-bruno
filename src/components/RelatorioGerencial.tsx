import React, { useState, useEffect } from 'react';
import type { Veiculo, Despesa } from '../types';
import { supabase } from '../lib/supabase';

interface RelatorioProps {
  veiculos: Veiculo[];
  despesas: Despesa[];
  userEmail?: string;
}

export function RelatorioGerencial({ veiculos, despesas }: RelatorioProps) {
  const [fechamentosHistorico, setFechamentosHistorico] = useState<any[]>([]);
  const [fechamentoSelecionado, setFechamentoSelecionado] = useState<any | null>(null);

  useEffect(() => {
    carregarHistoricoFechamentos();
  }, []);

  const carregarHistoricoFechamentos = async () => {
    const { data } = await supabase
      .from('fechamentos_caixa')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setFechamentosHistorico(data);
      if (data.length > 0) setFechamentoSelecionado(data[0]);
    }
  };

  const handleImprimirPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SELETOR DE FECHAMENTOS ANTERIORES */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            📅 Selecione a Semana do Fechamento
          </label>
          <select
            value={fechamentoSelecionado?.id || ''}
            onChange={(e) => {
              const item = fechamentosHistorico.find((f) => f.id === e.target.value);
              setFechamentoSelecionado(item || null);
            }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '13px', minWidth: '280px' }}
          >
            {fechamentosHistorico.length === 0 && <option value="">Nenhum fechamento registrado</option>}
            {fechamentosHistorico.map((f) => (
              <option key={f.id} value={f.id}>
                Semana de {new Date(f.created_at).toLocaleDateString('pt-BR')} — Saldo: R$ {Number(f.saldo_final).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {fechamentoSelecionado && (
          <button
            type="button"
            onClick={handleImprimirPDF}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
            }}
          >
            🖨️ Imprimir / Baixar PDF do Fechamento
          </button>
        )}
      </div>

      {/* ÁREA IMPRESSÁVEL DO RELATÓRIO */}
      {fechamentoSelecionado ? (
        <div id="relatorio-impressao" style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          
          {/* CABEÇALHO DO RELATÓRIO */}
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>💧 LAVA-RÁPIDO — FECHAMENTO SEMANAL</h2>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                Encerrado em: {new Date(fechamentoSelecionado.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                STATUS: ARQUIVADO
              </span>
            </div>
          </div>

          {/* CARDS RESUMO DO HISTÓRICO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0f9ff', borderLeft: '4px solid #0284c7' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>FATURAMENTO (PAGOS)</span>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', margin: '4px 0 0 0' }}>
                R$ {Number(fechamentoSelecionado.faturamento_pagos).toFixed(2).replace('.', ',')}
              </h3>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fff1f2', borderLeft: '4px solid #e11d48' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#be123c' }}>TOTAL DE GASTOS / SAÍDAS</span>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#e11d48', margin: '4px 0 0 0' }}>
                R$ {Number(fechamentoSelecionado.total_despesas).toFixed(2).replace('.', ',')}
              </h3>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>SALDO LÍQUIDO EM CAIXA</span>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#047857', margin: '4px 0 0 0' }}>
                R$ {Number(fechamentoSelecionado.saldo_final).toFixed(2).replace('.', ',')}
              </h3>
            </div>
          </div>

          {/* DETALHAMENTO COMPLETO DE GASTOS / SAÍDAS DA SEMANA */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase' }}>
              💸 Detalhamento dos Gastos / Saídas Lançadas:
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Tipo</th>
                  <th style={{ padding: '10px' }}>Descrição</th>
                  <th style={{ padding: '10px' }}>Favorecido</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {(fechamentoSelecionado.despesas_json || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Nenhum gasto registrado nesta semana.</td></tr>
                ) : (
                  (fechamentoSelecionado.despesas_json || []).map((d: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '700', textTransform: 'capitalize' }}>{d.tipo}</td>
                      <td style={{ padding: '10px' }}>{d.descricao}</td>
                      <td style={{ padding: '10px' }}>{d.funcionario || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                        - R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DETALHAMENTO DOS VEÍCULOS LAVADOS E QUITADOS */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase' }}>
              🚗 Veículos Lavados e Quitados ({fechamentoSelecionado.total_veiculos}):
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Modelo</th>
                  <th style={{ padding: '10px' }}>Categoria</th>
                  <th style={{ padding: '10px' }}>Lavador(es)</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {(fechamentoSelecionado.veiculos_json || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Nenhum veículo quitado nesta semana.</td></tr>
                ) : (
                  (fechamentoSelecionado.veiculos_json || []).map((v: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '700' }}>{v.modelo}</td>
                      <td style={{ padding: '10px' }}>{v.categoria || 'Carro'}</td>
                      <td style={{ padding: '10px' }}>{v.lavador || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                        R$ {Number(v.valor).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', textAlign: 'center', color: '#64748b' }}>
          Nenhum relatório de fechamento guardado ainda. Ao clicar em <strong>"Concluir & Fechar Caixa Semanal"</strong>, o relatório aparecerá aqui.
        </div>
      )}
    </div>
  );
}