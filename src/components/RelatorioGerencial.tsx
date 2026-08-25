import React, { useState } from 'react';
import type { Veiculo, Despesa } from '../types';

interface RelatorioProps {
  veiculos: Veiculo[];
  despesas: Despesa[];
  userEmail: string;
}

type SubAba = 'audit' | 'periodo' | 'anual';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function RelatorioGerencial({ veiculos, despesas, userEmail }: RelatorioProps) {
  const [subAba, setSubAba] = useState<SubAba>('audit');

  const hojeStr = new Date().toISOString().split('T')[0];

  const [tipoFiltro, setTipoFiltro] = useState<'dia' | 'intervalo' | 'mes'>('dia');
  const [dataInicio, setDataInicio] = useState(hojeStr);
  const [dataFim, setDataFim] = useState(hojeStr);
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  const [anoAnual, setAnoAnual] = useState(new Date().getFullYear());

  const eNomeDono = (nomeLavador: string) => {
    if (!nomeLavador) return false;
    const nomeUpper = nomeLavador.toUpperCase().trim();
    const userPrefix = userEmail ? userEmail.split('@')[0].toUpperCase().trim() : '';
    return (
      nomeUpper === 'BRUNO' ||
      nomeUpper.includes('BRUNO') ||
      nomeUpper === 'DONO' ||
      nomeUpper.includes('DONO') ||
      (userPrefix && (nomeUpper === userPrefix || userPrefix.includes(nomeUpper)))
    );
  };

  const formatLocalDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // FILTRAGEM DO PERÍODO
  const veiculosFiltrados = veiculos.filter(v => {
    if (!v.created_at) return false;
    const dataLocal = formatLocalDate(v.created_at);
    const d = new Date(v.created_at);

    if (tipoFiltro === 'dia') {
      return dataLocal === dataInicio;
    } else if (tipoFiltro === 'intervalo') {
      return dataLocal >= dataInicio && dataLocal <= dataFim;
    } else {
      return d.getMonth() === mesFiltro && d.getFullYear() === anoFiltro;
    }
  });

  const despesasFiltradas = despesas.filter(d => {
    if (!d.created_at) return false;
    const dataLocal = formatLocalDate(d.created_at);
    const dateObj = new Date(d.created_at);

    if (tipoFiltro === 'dia') {
      return dataLocal === dataInicio;
    } else if (tipoFiltro === 'intervalo') {
      return dataLocal >= dataInicio && dataLocal <= dataFim;
    } else {
      return dateObj.getMonth() === mesFiltro && dateObj.getFullYear() === anoFiltro;
    }
  });

  const veiculosPagosPeriodo = veiculosFiltrados.filter(v => v.pago);
  const faturamentoPeriodo = veiculosPagosPeriodo.reduce((acc, v) => acc + Number(v.valor), 0);
  const totalInsumosPeriodo = despesasFiltradas.filter(d => d.tipo === 'dispensa').reduce((acc, d) => acc + Number(d.valor), 0);

  // ESTATÍSTICAS DOS FUNCIONÁRIOS
  const statsLavadores: { [nome: string]: { quantidade: number; comissaoGanha: number; pago: number } } = {};
  let statsDono = { quantidadeSozinho: 0, quantidadeAjudou: 0 };

  veiculosPagosPeriodo.forEach(v => {
    if (v.lavador) {
      const todosNomes = v.lavador.split('/').map(n => n.trim()).filter(Boolean);
      const funcNomes = todosNomes.filter(n => !eNomeDono(n));
      const temDono = todosNomes.some(n => eNomeDono(n));

      if (temDono) {
        if (funcNomes.length === 0) statsDono.quantidadeSozinho += 1;
        else statsDono.quantidadeAjudou += 1;
      }

      if (funcNomes.length > 0) {
        const comissaoPorPessoa = 10 / funcNomes.length;
        funcNomes.forEach(nome => {
          if (!statsLavadores[nome]) {
            statsLavadores[nome] = { quantidade: 0, comissaoGanha: 0, pago: 0 };
          }
          statsLavadores[nome].quantidade += 1;
          statsLavadores[nome].comissaoGanha += comissaoPorPessoa;
        });
      }
    }
  });

  // Mapeia quanto já foi pago de saídas para cada funcionário
  let totalComissoesPagasNoPeriodo = 0;
  despesasFiltradas.forEach(d => {
    if (d.tipo === 'funcionario') {
      totalComissoesPagasNoPeriodo += Number(d.valor);
      if (d.funcionario) {
        const nomeUpper = d.funcionario.toUpperCase().trim();
        if (statsLavadores[nomeUpper]) {
          statsLavadores[nomeUpper].pago += Number(d.valor);
        } else {
          statsLavadores[nomeUpper] = { quantidade: 0, comissaoGanha: 0, pago: Number(d.valor) };
        }
      }
    }
  });

  const lucroLiquidoPeriodo = faturamentoPeriodo - totalInsumosPeriodo - totalComissoesPagasNoPeriodo;

  // BALANÇO ANUAL (12 MESES)
  const dadosMesesAnual = MESES.map((nomeMes, index) => {
    const veiculosDoMes = veiculos.filter(v => {
      if (!v.created_at || !v.pago) return false;
      const d = new Date(v.created_at);
      return d.getFullYear() === anoAnual && d.getMonth() === index;
    });

    const despesasDoMes = despesas.filter(d => {
      if (!d.created_at) return false;
      const dateObj = new Date(d.created_at);
      return dateObj.getFullYear() === anoAnual && dateObj.getMonth() === index;
    });

    const fat = veiculosDoMes.reduce((acc, v) => acc + Number(v.valor), 0);
    const insumos = despesasDoMes.filter(d => d.tipo === 'dispensa').reduce((acc, d) => acc + Number(d.valor), 0);
    const pagFunc = despesasDoMes.filter(d => d.tipo === 'funcionario').reduce((acc, d) => acc + Number(d.valor), 0);
    const lucro = fat - insumos - pagFunc;

    return {
      mes: nomeMes,
      quantidade: veiculosDoMes.length,
      faturamento: fat,
      despesas: insumos,
      comissoes: pagFunc,
      lucro,
    };
  });

  const totalFatAnual = dadosMesesAnual.reduce((acc, m) => acc + m.faturamento, 0);
  const totalDespAnual = dadosMesesAnual.reduce((acc, m) => acc + m.despesas, 0);
  const totalComissaoAnual = dadosMesesAnual.reduce((acc, m) => acc + m.comissoes, 0);
  const totalLucroAnual = totalFatAnual - totalDespAnual - totalComissaoAnual;

  const anosDisponiveis = Array.from(
    new Set([
      new Date().getFullYear(),
      ...veiculos.map(v => v.created_at ? new Date(v.created_at).getFullYear() : new Date().getFullYear()),
    ])
  ).sort((a, b) => b - a);

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    fontWeight: '600',
  };

  return (
    <div>
      {/* SUB-ABAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSubAba('audit')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            backgroundColor: subAba === 'audit' ? '#0f172a' : '#f1f5f9',
            color: subAba === 'audit' ? '#ffffff' : '#64748b',
          }}
        >
          📋 Auditoria de Lançamentos
        </button>

        <button
          onClick={() => setSubAba('periodo')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            backgroundColor: subAba === 'periodo' ? '#0f172a' : '#f1f5f9',
            color: subAba === 'periodo' ? '#ffffff' : '#64748b',
          }}
        >
          📊 Lucro por Período & Comissões
        </button>

        <button
          onClick={() => setSubAba('anual')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            backgroundColor: subAba === 'anual' ? '#0f172a' : '#f1f5f9',
            color: subAba === 'anual' ? '#ffffff' : '#64748b',
          }}
        >
          📅 Balanço Anual (12 Meses)
        </button>
      </div>

      {/* SUB-ABA 1: AUDITORIA */}
      {subAba === 'audit' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Data / Hora</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Veículo Cadastrado</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Lavador(es)</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Valor</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>👤 Registrado Por (E-mail)</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                    {v.created_at ? new Date(v.created_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#0f172a', fontSize: '14px', fontWeight: '700' }}>
                    {v.modelo} {v.cor && <span style={{ color: '#64748b', fontWeight: '500', fontSize: '12px' }}>({v.cor})</span>}
                  </td>
                  <td style={{ padding: '16px', color: '#2563eb', fontSize: '13px', fontWeight: '700' }}>
                    {v.lavador || 'Não informado'}
                  </td>
                  <td style={{ padding: '16px', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>
                    R$ {Number(v.valor).toFixed(2).replace('.', ',')}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', fontWeight: '700' }}>
                    <span style={{ backgroundColor: v.criado_por === userEmail ? '#dbeafe' : '#fef3c7', color: v.criado_por === userEmail ? '#1d4ed8' : '#b45309', padding: '4px 10px', borderRadius: '20px' }}>
                      {v.criado_por || 'Sistema Antigo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-ABA 2: LUCRO POR PERÍODO & COMISSÕES */}
      {subAba === 'periodo' && (
        <div>
          {/* BARRA DE FILTROS */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Filtrar Por:</label>
              <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as any)} style={inputStyle}>
                <option value="dia">Dia Específico</option>
                <option value="intervalo">Intervalo de Datas (Semana/Período)</option>
                <option value="mes">Mês Inteiro</option>
              </select>
            </div>

            {tipoFiltro === 'dia' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Data:</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={inputStyle} />
              </div>
            )}

            {tipoFiltro === 'intervalo' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>De:</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Até:</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            {tipoFiltro === 'mes' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Mês:</label>
                  <select value={mesFiltro} onChange={(e) => setMesFiltro(Number(e.target.value))} style={inputStyle}>
                    {MESES.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Ano:</label>
                  <select value={anoFiltro} onChange={(e) => setAnoFiltro(Number(e.target.value))} style={inputStyle}>
                    {anosDisponiveis.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* CARDS DE RESUMO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Faturamento (Pagos)</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0369a1', margin: '6px 0 0 0' }}>
                R$ {faturamentoPeriodo.toFixed(2).replace('.', ',')}
              </h3>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Dispensa / Insumos</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#e11d48', margin: '6px 0 0 0' }}>
                R$ {totalInsumosPeriodo.toFixed(2).replace('.', ',')}
              </h3>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pag. Funcionários (Saídas)</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#9333ea', margin: '6px 0 0 0' }}>
                R$ {totalComissoesPagasNoPeriodo.toFixed(2).replace('.', ',')}
              </h3>
            </div>

            <div style={{ backgroundColor: lucroLiquidoPeriodo >= 0 ? '#ecfdf5' : '#fff1f2', padding: '20px', borderRadius: '16px', border: `1px solid ${lucroLiquidoPeriodo >= 0 ? '#a7f3d0' : '#fecdd3'}` }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: lucroLiquidoPeriodo >= 0 ? '#047857' : '#be123c', textTransform: 'uppercase' }}>💰 Lucro Real do Caixa</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: lucroLiquidoPeriodo >= 0 ? '#047857' : '#be123c', margin: '6px 0 0 0' }}>
                R$ {lucroLiquidoPeriodo.toFixed(2).replace('.', ',')}
              </h3>
            </div>
          </div>

          {/* PAINEL DE CONTROLE DE PAGAMENTO DOS FUNCIONÁRIOS */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
              💵 Status de Pagamento da Equipe (No Período)
            </h3>

            {Object.keys(statsLavadores).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Nenhuma atividade registrada para funcionários neste período.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {Object.entries(statsLavadores).map(([lav, data]) => {
                  const restaPagar = data.comissaoGanha - data.pago;
                  const eQuitado = restaPagar <= 0;
                  const eBonus = restaPagar < 0;

                  return (
                    <div key={lav} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>👤 {lav}</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: eQuitado ? '#d1fae5' : '#fef3c7', color: eQuitado ? '#047857' : '#b45309', padding: '2px 8px', borderRadius: '12px' }}>
                            {eQuitado ? (eBonus ? '✨ Quitado com Bônus' : '✓ Quitado') : '⏳ Pendente'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 12px 0', fontWeight: '600' }}>
                          Lavou/Ajudou em <strong>{data.quantidade}</strong> veículo(s)
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                          <span>Comissão Gerada:</span>
                          <strong>R$ {data.comissaoGanha.toFixed(2).replace('.', ',')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9333ea' }}>
                          <span>Já Pago (Saídas):</span>
                          <strong>R$ {data.pago.toFixed(2).replace('.', ',')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginTop: '4px', color: eQuitado ? '#047857' : '#e11d48' }}>
                          <span>{eQuitado ? (eBonus ? 'Bônus Extra:' : 'Saldo Restante:') : 'Resta Pagar:'}</span>
                          <span>R$ {Math.abs(restaPagar).toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAINEL DO BRUNO (DONO) */}
            {(statsDono.quantidadeSozinho > 0 || statsDono.quantidadeAjudou > 0) && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>👑 Atuação de Bruno (Dono) no Pátio:</span>
                  <p style={{ fontSize: '12px', color: '#1e40af', margin: '4px 0 0 0', fontWeight: '600' }}>
                    Lavou sozinho <strong>{statsDono.quantidadeSozinho}</strong> carro(s) e ajudou a equipe em <strong>{statsDono.quantidadeAjudou}</strong> carro(s).
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase' }}>Retido no Caixa:</span>
                  <p style={{ fontSize: '15px', fontWeight: '900', color: '#1d4ed8', margin: 0 }}>
                    100% do lucro vai pro Caixa
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-ABA 3: BALANÇO ANUAL */}
      {subAba === 'anual' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Selecione o Ano:</span>
              <select value={anoAnual} onChange={(e) => setAnoAnual(Number(e.target.value))} style={{ ...inputStyle, fontSize: '15px' }}>
                {anosDisponiveis.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Fat. Anual: </span>
                <strong style={{ fontSize: '15px', color: '#0369a1' }}>R$ {totalFatAnual.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Dispensa Anual: </span>
                <strong style={{ fontSize: '15px', color: '#e11d48' }}>R$ {totalDespAnual.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Pag. Equipe Anual: </span>
                <strong style={{ fontSize: '15px', color: '#9333ea' }}>R$ {totalComissaoAnual.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Lucro Real: </span>
                <strong style={{ fontSize: '15px', color: totalLucroAnual >= 0 ? '#047857' : '#be123c' }}>
                  R$ {totalLucroAnual.toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Mês ({anoAnual})</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Lavações</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Faturamento Bruto</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Dispensa / Saídas</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Pag. Funcionários</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Lucro Líquido Real</th>
                </tr>
              </thead>
              <tbody>
                {dadosMesesAnual.map((m) => (
                  <tr key={m.mes} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>
                      {m.mes}
                    </td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '13px', fontWeight: '600' }}>
                      {m.quantidade} veículo(s)
                    </td>
                    <td style={{ padding: '16px', color: '#0369a1', fontSize: '14px', fontWeight: '700' }}>
                      R$ {m.faturamento.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ padding: '16px', color: '#e11d48', fontSize: '14px', fontWeight: '700' }}>
                      R$ {m.despesas.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ padding: '16px', color: '#9333ea', fontSize: '14px', fontWeight: '700' }}>
                      R$ {m.comissoes.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '900', color: m.lucro >= 0 ? '#047857' : '#be123c' }}>
                      R$ {m.lucro.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}