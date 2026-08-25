import React, { useState, useEffect } from 'react';
import type { Veiculo, Despesa } from '../types';
import { supabase } from '../lib/supabase';

interface FechamentoProps {
  veiculos: Veiculo[];
  despesas: Despesa[];
  onAdicionarDespesa: (despesa: Omit<Despesa, 'id'>) => void;
  onExcluirDespesa: (id: string) => void;
}

export function FechamentoSemanal({ veiculos, despesas, onAdicionarDespesa, onExcluirDespesa }: FechamentoProps) {
  const [descricao, setDescricao] = useState('');
  const [valorSaida, setValorSaida] = useState('');
  const [tipoSaida, setTipoSaida] = useState<'dispensa' | 'funcionario' | 'pessoal'>('dispensa');
  
  // Controle de Funcionários e Sugestão
  const [equipeDB, setEquipeDB] = useState<any[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState('');
  const [sugestaoIa, setSugestaoIa] = useState<number | null>(null);

  useEffect(() => {
    buscarEquipe();
  }, []);

  const buscarEquipe = async () => {
    const { data } = await supabase.from('equipe').select('*').order('nome');
    if (data) setEquipeDB(data);
  };

  // Garante a lista completa de funcionários (excluindo Bruno/Dono)
  const listaFuncionarios = Array.from(
    new Set([
      ...equipeDB.map(e => e.nome.toUpperCase().trim()),
      'GABRIEL', 'NEGO', 'RAFA'
    ])
  ).filter(nome => nome !== 'BRUNO' && nome !== 'DONO');

  // Calcula quanto o funcionário tem a receber pendente
  useEffect(() => {
    if (tipoSaida === 'funcionario' && funcionarioSelecionado) {
      const nomeUpper = funcionarioSelecionado.toUpperCase().trim();

      // Total acumulado em comissões
      const totalComissaoAcumulada = veiculos
        .filter(v => v.pago && v.lavador)
        .reduce((acc, v) => {
          const todosNomes = v.lavador!.split('/').map(n => n.trim().toUpperCase());
          const funcs = todosNomes.filter(n => n !== 'BRUNO' && n !== 'DONO');
          if (funcs.includes(nomeUpper)) {
            return acc + (10 / funcs.length);
          }
          return acc;
        }, 0);

      // Total já pago em saídas anteriores
      const totalJaPago = despesas
        .filter(d => d.tipo === 'funcionario' && d.funcionario?.toUpperCase().trim() === nomeUpper)
        .reduce((acc, d) => acc + Number(d.valor), 0);

      const saldoResta = Math.max(0, totalComissaoAcumulada - totalJaPago);
      setSugestaoIa(saldoResta);
      setValorSaida(saldoResta > 0 ? saldoResta.toFixed(2) : '');
      setDescricao(`Pagamento Diária / Comissão - ${nomeUpper}`);
    } else {
      setSugestaoIa(null);
    }
  }, [tipoSaida, funcionarioSelecionado, veiculos, despesas]);

  const handleCadastrarSaida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valorSaida) return;

    onAdicionarDespesa({
      descricao,
      valor: parseFloat(valorSaida),
      tipo: tipoSaida,
      funcionario: tipoSaida === 'funcionario' ? funcionarioSelecionado : undefined,
    });

    setDescricao('');
    setValorSaida('');
    setFuncionarioSelecionado('');
    setTipoSaida('dispensa');
    setSugestaoIa(null);
  };

  // Cálculos do Dashboard
  const faturamentoPagos = veiculos.filter(v => v.pago).reduce((acc, v) => acc + Number(v.valor), 0);
  const totalContratos = veiculos.filter(v => v.e_contrato && !v.pago).reduce((acc, v) => acc + Number(v.valor), 0);
  const totalDispensa = despesas.filter(d => d.tipo === 'dispensa').reduce((acc, d) => acc + Number(d.valor), 0);
  const totalPagFuncionarios = despesas.filter(d => d.tipo === 'funcionario').reduce((acc, d) => acc + Number(d.valor), 0);
  const saldoFinalCaixa = faturamentoPagos - totalDispensa - totalPagFuncionarios;

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#ffffff',
    fontWeight: '600'
  };

  const valorNum = parseFloat(valorSaida) || 0;
  const extraBonus = sugestaoIa !== null && valorNum > sugestaoIa ? valorNum - sugestaoIa : 0;

  return (
    <div style={{ marginBottom: '28px' }}>
      
      {/* CARDS SUPERIORES DO CAIXA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #0284c7', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Faturamento (Pagos)</span>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', margin: '4px 0 0 0' }}>
            R$ {faturamentoPagos.toFixed(2).replace('.', ',')}
          </h2>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #d97706', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Contratos (A Receber)</span>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#d97706', margin: '4px 0 0 0' }}>
            R$ {totalContratos.toFixed(2).replace('.', ',')}
          </h2>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #e11d48', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Dispensa / Pátio</span>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#e11d48', margin: '4px 0 0 0' }}>
            R$ {totalDispensa.toFixed(2).replace('.', ',')}
          </h2>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #9333ea', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pag. Funcionários</span>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#9333ea', margin: '4px 0 0 0' }}>
            R$ {totalPagFuncionarios.toFixed(2).replace('.', ',')}
          </h2>
        </div>

        <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Saldo Final em Caixa</span>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#047857', margin: '4px 0 0 0' }}>
            R$ {saldoFinalCaixa.toFixed(2).replace('.', ',')}
          </h2>
        </div>
      </div>

      {/* FORMULÁRIO DE LANÇAMENTO DE SAÍDAS */}
      <form onSubmit={handleCadastrarSaida} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💸 Lançar Saída / Gastos do Lava-Jato
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', alignItems: 'end' }}>
          
          {/* TIPO DE SAÍDA */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tipo de Saída</label>
            <select 
              value={tipoSaida} 
              onChange={(e) => {
                setTipoSaida(e.target.value as any);
                if (e.target.value !== 'funcionario') setFuncionarioSelecionado('');
              }} 
              style={{ ...inputStyle, fontWeight: '700' }}
            >
              <option value="dispensa">Dispensa / Insumos</option>
              <option value="funcionario">Pagamento Funcionário</option>
              <option value="pessoal">Retirada Pessoal</option>
            </select>
          </div>

          {/* SELEÇÃO DO FUNCIONÁRIO (Aparece se for Pagamento Funcionário) */}
          {tipoSaida === 'funcionario' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Selecione o Funcionário</label>
              <select 
                value={funcionarioSelecionado} 
                onChange={(e) => setFuncionarioSelecionado(e.target.value)} 
                required 
                style={{ ...inputStyle, fontWeight: '700', borderColor: '#9333ea', backgroundColor: '#faf5ff' }}
              >
                <option value="">Selecione...</option>
                {listaFuncionarios.map(nome => (
                  <option key={nome} value={nome}>👤 {nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* DESCRIÇÃO DA SAÍDA */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Detergente / Diária RAFA" 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>

          {/* VALOR DA SAÍDA COM SUGESTÃO DA IA */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
              Valor (R$)
              {sugestaoIa !== null && sugestaoIa > 0 && (
                <span style={{ color: '#059669', fontSize: '10px', textTransform: 'none' }}>✨ Sugestão IA: R$ {sugestaoIa.toFixed(2)}</span>
              )}
            </label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="50,00" 
              value={valorSaida} 
              onChange={(e) => setValorSaida(e.target.value)} 
              required 
              style={{ 
                ...inputStyle, 
                fontWeight: '800',
                borderColor: extraBonus > 0 ? '#10b981' : '#cbd5e1',
                backgroundColor: extraBonus > 0 ? '#ecfdf5' : '#ffffff'
              }} 
            />
          </div>

          <button type="submit" style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '11px 16px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', height: '40px' }}>
            - Registrar Saída
          </button>
        </div>

        {/* ALERTA DE BÔNUS / COMISSÃO EXTRA */}
        {extraBonus > 0 && (
          <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '12px', color: '#047857', fontWeight: '700' }}>
            ✨ O valor digitado inclui <strong>+ R$ {extraBonus.toFixed(2).replace('.', ',')}</strong> de Bônus / Comissão Extra para o funcionário!
          </div>
        )}

        {/* LISTA DE SAÍDAS RECENTES */}
        {despesas.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saídas Lançadas:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {despesas.map((d) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700' }}>
                  <span style={{ color: '#0f172a' }}>{d.descricao}</span>
                  <span style={{ color: '#e11d48' }}>- R$ {Number(d.valor).toFixed(2).replace('.', ',')}</span>
                  {d.id && (
                    <button type="button" onClick={() => onExcluirDespesa(d.id!)} style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: '800' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}