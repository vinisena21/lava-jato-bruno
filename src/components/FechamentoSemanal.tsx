import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Veiculo, Despesa } from '../types';
import { supabase } from '../lib/supabase';

interface FechamentoProps {
  veiculos: Veiculo[];
  despesas: Despesa[];
  onAdicionarDespesa: (despesa: Omit<Despesa, 'id'>) => void;
  onExcluirDespesa: (id: string) => void;
  onCaixaFechado?: () => void; // Callback para recarregar os dados na tela inicial
}

export function FechamentoSemanal({ 
  veiculos, 
  despesas, 
  onAdicionarDespesa, 
  onExcluirDespesa,
  onCaixaFechado 
}: FechamentoProps) {
  const [descricao, setDescricao] = useState('');
  const [valorSaida, setValorSaida] = useState('');
  const [tipoSaida, setTipoSaida] = useState<'dispensa' | 'funcionario' | 'pessoal'>('dispensa');
  const [isFechandoCaixa, setIsFechandoCaixa] = useState(false);
  
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
    if (!descricao || !valorSaida) {
      toast.warning('Preencha a descrição e o valor da saída.');
      return;
    }

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

  // Lógica para Fechamento do Caixa
  const handleFecharCaixa = async () => {
    if (veiculos.length === 0 && despesas.length === 0) {
      toast.info('O caixa atual já está limpo e sem movimentações.');
      return;
    }

    const confirmacao = window.confirm(
      `Deseja realmente fechar o caixa atual?\n\n` +
      `• Faturamento: R$ ${faturamentoPagos.toFixed(2)}\n` +
      `• Saldo Final: R$ ${saldoFinalCaixa.toFixed(2)}\n\n` +
      `Isso irá limpar a tela inicial e salvar o relatório no histórico.`
    );

    if (!confirmacao) return;

    setIsFechandoCaixa(true);
    try {
      // 1. Salva o registro compilado do fechamento do caixa
      const { error: errorCaixa } = await supabase.from('fechamentos_caixa').insert([
        {
          data_fechamento: new Date().toISOString(),
          faturamento_total: faturamentoPagos,
          total_contratos: totalContratos,
          total_dispensa: totalDispensa,
          total_pag_funcionarios: totalPagFuncionarios,
          saldo_final: saldoFinalCaixa,
          qtd_veiculos: veiculos.length
        }
      ]);

      if (errorCaixa) throw errorCaixa;

      // 2. Atualiza o status dos veículos do caixa atual para 'fechado'
      const { error: errorVeiculos } = await supabase
        .from('veiculos')
        .update({ status: 'fechado' })
        .eq('status', 'aberto');

      if (errorVeiculos) throw errorVeiculos;

      // 3. Atualiza o status das despesas do caixa atual para 'fechado'
      const { error: errorDespesas } = await supabase
        .from('despesas')
        .update({ status: 'fechado' })
        .eq('status', 'aberto');

      if (errorDespesas) throw errorDespesas;

      toast.success('Caixa fechado com sucesso! A tela foi limpa para o novo ciclo.');
      
      // Notifica o componente pai para recarregar/limpar o estado
      if (onCaixaFechado) {
        onCaixaFechado();
      }
    } catch (err: any) {
      toast.error('Erro ao fechar o caixa: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsFechandoCaixa(false);
    }
  };

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

      {/* FORMULÁRIO DE LANÇAMENTO DE SAÍDAS E AÇÃO DE FECHAR CAIXA */}
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

        {/* LISTA DE SAÍDAS RECENTES DO CAIXA ATUAL */}
        {despesas.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saídas Lançadas neste Caixa:</span>
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

        {/* ÁREA / BOTÃO PARA FECHAR CAIXA */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Encerrar Período / Caixa Atual</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Finaliza o caixa, limpa os registros do pátio na tela inicial e envia tudo para os relatórios.</p>
          </div>
          <button
            type="button"
            onClick={handleFecharCaixa}
            disabled={isFechandoCaixa}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: isFechandoCaixa ? 'not-allowed' : 'pointer',
              opacity: isFechandoCaixa ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
            }}
          >
            {isFechandoCaixa ? 'Fechando...' : '🔒 Fechar Caixa Atual'}
          </button>
        </div>

      </form>
    </div>
  );
}