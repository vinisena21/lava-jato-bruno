import React, { useState, useEffect } from 'react';
import type { Veiculo, Despesa } from '../types';
import { supabase } from '../lib/supabase';

interface RelatorioProps {
  veiculos: Veiculo[];
  despesas: Despesa[];
  userEmail?: string;
}

export function RelatorioGerencial({ veiculos, despesas }: RelatorioProps) {
  const [abaInterna, setAbaInterna] = useState<'meses' | 'funcionarios' | 'fechamentos'>('meses');
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [funcionarioFiltro, setFuncionarioFiltro] = useState<string>('todos');
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

    if (data && data.length > 0) {
      setFechamentosHistorico(data);
      setFechamentoSelecionado(data[0]);
    }
  };

  // Helper para formatar Mês/Ano (ex: "09/2026")
  const getMesAno = (dateString?: string) => {
    if (!dateString) return 'Outros';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Outros';
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${mes}/${ano}`;
  };

  // Obter lista única de meses presentes nos dados
  const listaMeses = Array.from(
    new Set([
      ...veiculos.map(v => getMesAno(v.created_at)),
      ...despesas.map(d => getMesAno(d.created_at))
    ])
  ).filter(m => m !== 'Outros').sort().reverse();

  // Despesas de Funcionários (Pagamentos e Diárias)
  const pagamentosFuncionarios = despesas.filter(d => d.tipo === 'funcionario');

  // Obter lista única de funcionários
  const listaFuncionarios = Array.from(
    new Set(pagamentosFuncionarios.map(d => d.funcionario?.toUpperCase().trim()).filter(Boolean))
  );

  // Filtragem de dados por mês e por funcionário
  const despesasFiltradas = despesas.filter(d => {
    const matchMes = mesSelecionado === 'todos' || getMesAno(d.created_at) === mesSelecionado;
    const matchFunc = funcionarioFiltro === 'todos' || (d.funcionario && d.funcionario.toUpperCase().trim() === funcionarioFiltro);
    return matchMes && matchFunc;
  });

  const veiculosFiltrados = veiculos.filter(v => {
    const matchMes = mesSelecionado === 'todos' || getMesAno(v.created_at) === mesSelecionado;
    return matchMes;
  });

  // Totais do Período Selecionado
  const faturamentoTotal = veiculosFiltrados.filter(v => v.pago).reduce((acc, v) => acc + Number(v.valor), 0);
  const totalInsumos = despesasFiltradas.filter(d => d.tipo === 'dispensa').reduce((acc, d) => acc + Number(d.valor), 0);
  const totalPagoFuncionarios = despesasFiltradas.filter(d => d.tipo === 'funcionario').reduce((acc, d) => acc + Number(d.valor), 0);
  const totalRetiradasPessoais = despesasFiltradas.filter(d => d.tipo === 'pessoal').reduce((acc, d) => acc + Number(d.valor), 0);
  const saldoLiquido = faturamentoTotal - totalInsumos - totalPagoFuncionarios - totalRetiradasPessoais;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SELETOR DE ABAS INTERNAS */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setAbaInterna('meses')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: abaInterna === 'meses' ? '#0f172a' : '#f1f5f9',
            color: abaInterna === 'meses' ? '#ffffff' : '#64748b',
          }}
        >
          📅 Resumo Mensal & Geral
        </button>

        <button
          type="button"
          onClick={() => setAbaInterna('funcionarios')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: abaInterna === 'funcionarios' ? '#9333ea' : '#f1f5f9',
            color: abaInterna === 'funcionarios' ? '#ffffff' : '#64748b',
          }}
        >
          👤 Histórico de Pagamento de Funcionários
        </button>

        <button
          type="button"
          onClick={() => setAbaInterna('fechamentos')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: abaInterna === 'fechamentos' ? '#0284c7' : '#f1f5f9',
            color: abaInterna === 'fechamentos' ? '#ffffff' : '#64748b',
          }}
        >
          🔒 Fechamentos Semanais (PDF)
        </button>
      </div>

      {/* ABA 1: RESUMO MENSAL */}
      {abaInterna === 'meses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* BARRA DE FILTROS */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Filtrar por Mês
              </label>
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '13px', minWidth: '160px' }}
              >
                <option value="todos">Todos os Meses</option>
                {listaMeses.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CARDS MENSIAIS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #0284c7', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Faturamento Total (Pagos)</span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', margin: '4px 0 0 0' }}>
                R$ {faturamentoTotal.toFixed(2).replace('.', ',')}
              </h2>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #e11d48', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Dispensa / Insumos</span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#e11d48', margin: '4px 0 0 0' }}>
                R$ {totalInsumos.toFixed(2).replace('.', ',')}
              </h2>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #9333ea', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pag. Funcionários</span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#9333ea', margin: '4px 0 0 0' }}>
                R$ {totalPagoFuncionarios.toFixed(2).replace('.', ',')}
              </h2>
            </div>

            <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Saldo Líquido</span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#047857', margin: '4px 0 0 0' }}>
                R$ {saldoLiquido.toFixed(2).replace('.', ',')}
              </h2>
            </div>
          </div>

          {/* TABELA DE REGISTROS MENSIAIS */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
              📋 Todos os Lançamentos de Gastos / Saídas ({despesasFiltradas.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Tipo</th>
                  <th style={{ padding: '10px' }}>Descrição</th>
                  <th style={{ padding: '10px' }}>Favorecido</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {despesasFiltradas.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Nenhum gasto registrado para este filtro.</td></tr>
                ) : (
                  despesasFiltradas.map((d, i) => (
                    <tr key={d.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ padding: '10px', fontWeight: '700', textTransform: 'capitalize' }}>{d.tipo}</td>
                      <td style={{ padding: '10px' }}>{d.descricao}</td>
                      <td style={{ padding: '10px', fontWeight: '600' }}>{d.funcionario || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                        - R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE PAGAMENTO DE FUNCIONÁRIOS */}
      {abaInterna === 'funcionarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* FILTROS DE FUNCIONÁRIOS E MÊS */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Selecionar Funcionário
              </label>
              <select
                value={funcionarioFiltro}
                onChange={(e) => setFuncionarioFiltro(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '13px', minWidth: '180px' }}
              >
                <option value="todos">Todos os Funcionários</option>
                {listaFuncionarios.map(nome => (
                  <option key={nome} value={nome as string}>{nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Filtrar Mês
              </label>
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '13px', minWidth: '160px' }}
              >
                <option value="todos">Todos os Meses</option>
                {listaMeses.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CARD DE TOTAL PAGO NO FILTRO */}
          <div style={{ backgroundColor: '#faf5ff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #9333ea', border: '1px solid #e9d5ff' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#7e22ce', textTransform: 'uppercase' }}>
              Total Pago aos Funcionários ({funcionarioFiltro === 'todos' ? 'Geral' : funcionarioFiltro})
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#9333ea', margin: '4px 0 0 0' }}>
              R$ {despesasFiltradas.filter(d => d.tipo === 'funcionario').reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
            </h2>
          </div>

          {/* TABELA DE HISTÓRICO DE PAGAMENTOS */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
              👤 Histórico Detalhado de Pagamentos / Diárias
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Funcionário</th>
                  <th style={{ padding: '10px' }}>Descrição</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor Pago</th>
                </tr>
              </thead>
              <tbody>
                {despesasFiltradas.filter(d => d.tipo === 'funcionario').length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Nenhum pagamento registrado para o filtro selecionado.</td></tr>
                ) : (
                  despesasFiltradas.filter(d => d.tipo === 'funcionario').map((d, i) => (
                    <tr key={d.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ padding: '10px', fontWeight: '800', color: '#9333ea' }}>
                        👤 {d.funcionario || 'Não informado'}
                      </td>
                      <td style={{ padding: '10px' }}>{d.descricao}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                        R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: FECHAMENTOS SEMANAIS (PDF) */}
      {abaInterna === 'fechamentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                📅 Selecione o Fechamento Semanal Salvo
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
                onClick={() => window.print()}
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

          {fechamentoSelecionado ? (
            <div id="relatorio-impressao" style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>💧 LAVA-RÁPIDO — FECHAMENTO SEMANAL</h2>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                    Encerrado em: {new Date(fechamentoSelecionado.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0f9ff', borderLeft: '4px solid #0284c7' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1' }}>FATURAMENTO (PAGOS)</span>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', margin: '4px 0 0 0' }}>
                    R$ {Number(fechamentoSelecionado.faturamento_pagos).toFixed(2).replace('.', ',')}
                  </h3>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fff1f2', borderLeft: '4px solid #e11d48' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#be123c' }}>TOTAL DE GASTOS</span>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#e11d48', margin: '4px 0 0 0' }}>
                    R$ {Number(fechamentoSelecionado.total_despesas).toFixed(2).replace('.', ',')}
                  </h3>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>SALDO LÍQUIDO</span>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#047857', margin: '4px 0 0 0' }}>
                    R$ {Number(fechamentoSelecionado.saldo_final).toFixed(2).replace('.', ',')}
                  </h3>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase' }}>
                  💸 Gastos / Saídas Gravadas:
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
                    {(fechamentoSelecionado.despesas_json || []).map((d: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: '700', textTransform: 'capitalize' }}>{d.tipo}</td>
                        <td style={{ padding: '10px' }}>{d.descricao}</td>
                        <td style={{ padding: '10px' }}>{d.funcionario || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                          - R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', textAlign: 'center', color: '#64748b' }}>
              Nenhum fechamento selecionado.
            </div>
          )}
        </div>
      )}

    </div>
  );
}