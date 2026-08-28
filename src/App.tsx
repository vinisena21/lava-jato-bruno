import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import type { Veiculo, Despesa, RoleUsuario } from './types';
import { supabase } from './lib/supabase';
import { FormularioVeiculo } from './components/FormularioVeiculo';
import { ListaVeiculos } from './components/ListaVeiculos';
import { FiltroVeiculos } from './components/FiltroVeiculos';
import { RelatorioFechamento } from './components/RelatorioFechamento';
import { FechamentoSemanal } from './components/FechamentoSemanal';
import { RelatorioGerencial } from './components/RelatorioGerencial';
import { GestaoUsuarios } from './components/GestaoUsuarios';
import { Login } from './components/Login';

type AbaNavegacao = 'dashboard' | 'fila' | 'financeiro' | 'relatorio' | 'usuarios';

// EMISSOR DE ALERTA SONORO (Web Audio API - Funciona em qualquer navegador)
const tocarSomNotificacao = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nota D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Nota A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error('Erro ao emitir notificação sonora:', e);
  }
};

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarVeiculos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('veiculos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setVeiculos(data as Veiculo[]);
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
      toast.error('Erro ao carregar lista de veículos');
    } finally {
      setLoading(false);
    }
  };

  const buscarDespesas = async () => {
    try {
      const { data, error } = await supabase.from('despesas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setDespesas(data as Despesa[]);
    } catch (err) {
      console.error('Erro ao buscar despesas:', err);
    }
  };

  // ASSINATURA EM TEMPO REAL COM ALERTA SONORO
  useEffect(() => {
    if (session) {
      buscarVeiculos();
      buscarDespesas();

      // Escuta novos veículos no pátio e toca o bipe
      const channelVeiculos = supabase
        .channel('realtime-veiculos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'veiculos' }, () => {
          tocarSomNotificacao(); // TOCAR SOM!
          toast.info('Novo veículo adicionado ao pátio!');
          buscarVeiculos();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'veiculos' }, () => {
          buscarVeiculos();
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'veiculos' }, () => {
          buscarVeiculos();
        })
        .subscribe();

      const channelDespesas = supabase
        .channel('realtime-despesas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'despesas' }, () => {
          buscarDespesas();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channelVeiculos);
        supabase.removeChannel(channelDespesas);
      };
    }
  }, [session]);

  if (loadingSession) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#64748b' }}>Carregando sistema...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const userRole: RoleUsuario = session.user?.user_metadata?.role || 'funcionario';
  const userEmail = session.user?.email || '';
  const userName = userEmail.split('@')[0];

  if (userRole === 'funcionario' && abaAtiva !== 'fila') {
    setAbaAtiva('fila');
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info('Sessão encerrada.');
  };

  const handleAdicionarVeiculo = async (novoVeiculo: Veiculo) => {
    try {
      const veiculoComAutor = { ...novoVeiculo, criado_por: userEmail };
      const { data, error } = await supabase.from('veiculos').insert([veiculoComAutor]).select();
      if (error) throw error;
      if (data) {
        setVeiculos((prev) => [data[0] as Veiculo, ...prev]);
        toast.success('Veículo cadastrado com sucesso!');
      }
    } catch (err: any) {
      toast.error(`Erro ao cadastrar veículo: ${err.message}`);
    }
  };

  const handleTogglePagamento = async (id: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase.from('veiculos').update({ pago: !statusAtual }).eq('id', id);
      if (error) throw error;
      setVeiculos((prev) => prev.map((v) => (v.id === id ? { ...v, pago: !statusAtual } : v)));
      toast.success(!statusAtual ? 'Pagamento confirmado!' : 'Status alterado para pendente.');
    } catch (err) {
      console.error('Erro ao atualizar pagamento:', err);
      toast.error('Erro ao atualizar status de pagamento.');
    }
  };

  const handleExcluirVeiculo = (id: string) => {
    toast('Deseja realmente remover este veículo?', {
      description: 'Esta ação não poderá ser desfeita.',
      action: {
        label: 'Excluir',
        onClick: async () => {
          try {
            const { error } = await supabase.from('veiculos').delete().eq('id', id);
            if (error) throw error;
            setVeiculos((prev) => prev.filter((v) => v.id !== id));
            toast.success('Veículo removido do pátio com sucesso!');
          } catch (err) {
            toast.error('Erro ao excluir veículo no banco de dados.');
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => toast.dismiss(),
      },
    });
  };

  const handleAdicionarDespesa = async (novaDespesa: Omit<Despesa, 'id'>) => {
    try {
      const despesaComAutor = { ...novaDespesa, criado_por: userEmail };
      const { data, error } = await supabase.from('despesas').insert([despesaComAutor]).select();
      if (error) throw error;
      if (data) {
        setDespesas((prev) => [data[0] as Despesa, ...prev]);
        toast.success('Despesa lançada com sucesso!');
      }
    } catch (err: any) {
      toast.error(`Erro no banco de dados: ${err.message}`);
    }
  };

  const handleExcluirDespesa = (id: string) => {
    toast('Excluir este lançamento de despesa?', {
      action: {
        label: 'Excluir',
        onClick: async () => {
          try {
            const { error } = await supabase.from('despesas').delete().eq('id', id);
            if (error) throw error;
            setDespesas((prev) => prev.filter((d) => d.id !== id));
            toast.success('Despesa removida com sucesso!');
          } catch (err) {
            console.error('Erro ao excluir despesa:', err);
            toast.error('Erro ao excluir despesa.');
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => toast.dismiss(),
      },
    });
  };

  const veiculosFiltrados = veiculos.filter(
    (v) =>
      (v.modelo && v.modelo.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.categoria && v.categoria.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.cor && v.cor.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.empresa_contrato && v.empresa_contrato.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.lavador && v.lavador.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  const getMenuItemStyle = (aba: AbaNavegacao): React.CSSProperties => {
    const isSelected = abaAtiva === aba;
    return {
      backgroundColor: isSelected ? '#163847' : 'transparent',
      color: isSelected ? '#ffffff' : '#64748b',
      padding: '10px 14px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: isSelected ? '700' : '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div className="app-container">
      {/* Container global de Notificações Toast */}
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar Lateral */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f59e0b', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💧</div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Lava-Rápido</h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Gestão operacional</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {userRole === 'dono' && (
              <button onClick={() => setAbaAtiva('dashboard')} style={getMenuItemStyle('dashboard')}>
                📊 Dashboard
              </button>
            )}

            <button onClick={() => setAbaAtiva('fila')} style={getMenuItemStyle('fila')}>
              🚗 Fila de Lavagem
            </button>

            {userRole === 'dono' && (
              <>
                <button onClick={() => setAbaAtiva('financeiro')} style={getMenuItemStyle('financeiro')}>
                  💳 Fechamento / Caixa
                </button>
                <button onClick={() => setAbaAtiva('relatorio')} style={getMenuItemStyle('relatorio')}>
                  📋 Relatórios Gerenciais
                </button>
                <button onClick={() => setAbaAtiva('usuarios')} style={getMenuItemStyle('usuarios')}>
                  🔐 Usuários & Segurança
                </button>
              </>
            )}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #163847', paddingTop: '16px', paddingLeft: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: '0 0 2px 0' }}>{userName}</p>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px 0' }}>
            {userRole === 'dono' ? '👑 Administrador' : '👤 Colaborador'}
          </p>

          <button onClick={handleLogout} style={{ backgroundColor: 'transparent', border: '1px solid #163847', color: '#94a3b8', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            ↳ Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main-content">
        
        {/* DASHBOARD */}
        {abaAtiva === 'dashboard' && userRole === 'dono' && (
          <div>
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Dashboard / Área Administrativa</p>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Dashboard Gerencial</h1>
            </header>
            <FechamentoSemanal veiculos={veiculos} despesas={despesas} onAdicionarDespesa={handleAdicionarDespesa} onExcluirDespesa={handleExcluirDespesa} />
            <FormularioVeiculo onAdicionarVeiculo={handleAdicionarVeiculo} userRole={userRole} />
            <div style={{ marginBottom: '20px', marginTop: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Veículos em Pátio ({veiculosFiltrados.length})</h2>
              <FiltroVeiculos termo={termoBusca} onTermoChange={setTermoBusca} />
            </div>
            {loading ? <p>Carregando...</p> : <ListaVeiculos veiculos={veiculosFiltrados} onTogglePagamento={handleTogglePagamento} onExcluirVeiculo={handleExcluirVeiculo} userRole={userRole} />}
          </div>
        )}

        {/* FILA DE LAVAGEM */}
        {abaAtiva === 'fila' && (
          <div>
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Pátio / Operação</p>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Fila de Lavagem</h1>
            </header>
            <FormularioVeiculo onAdicionarVeiculo={handleAdicionarVeiculo} userRole={userRole} />
            <div style={{ marginBottom: '20px', marginTop: '24px' }}><FiltroVeiculos termo={termoBusca} onTermoChange={setTermoBusca} /></div>
            {loading ? <p>Carregando...</p> : <ListaVeiculos veiculos={veiculosFiltrados} onTogglePagamento={handleTogglePagamento} onExcluirVeiculo={handleExcluirVeiculo} userRole={userRole} />}
          </div>
        )}

        {/* FINANCEIRO */}
        {abaAtiva === 'financeiro' && userRole === 'dono' && (
          <div>
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Caixa / Fechamento Semanal</p>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Balanço do Período</h1>
            </header>
            <FechamentoSemanal veiculos={veiculos} despesas={despesas} onAdicionarDespesa={handleAdicionarDespesa} onExcluirDespesa={handleExcluirDespesa} />
            <RelatorioFechamento veiculos={veiculos} />
          </div>
        )}

        {/* RELATÓRIOS GERENCIAIS */}
        {abaAtiva === 'relatorio' && userRole === 'dono' && (
          <div>
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Auditoria & Lucratividade</p>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Relatórios Gerenciais</h1>
            </header>

            <RelatorioGerencial veiculos={veiculos} despesas={despesas} userEmail={userEmail} />
          </div>
        )}

        {/* GESTÃO DE USUÁRIOS & SEGURANÇA */}
        {abaAtiva === 'usuarios' && userRole === 'dono' && (
          <div>
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Segurança / Controle de Acesso</p>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Gestão de Usuários & Acessos</h1>
            </header>

            <GestaoUsuarios />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;