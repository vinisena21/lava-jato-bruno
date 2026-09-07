import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { supabase } from './lib/supabase';
import type { Veiculo, Despesa, RoleUsuario } from './types';
import { FormularioVeiculo } from './components/FormularioVeiculo';
import { ListaVeiculos } from './components/ListaVeiculos';
import { FechamentoSemanal } from './components/FechamentoSemanal';
import { GestaoUsuarios } from './components/GestaoUsuarios';
import { RelatorioGerencial } from './components/RelatorioGerencial';
import { ConfirmModal } from './components/ConfirmModal';
import { Login } from './components/Login';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [userRole, setUserRole] = useState<RoleUsuario>('dono');
  const [userEmail, setUserEmail] = useState<string>('');
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'fila' | 'fechamento' | 'relatorios' | 'usuarios'>('dashboard');
  const [termoBusca, setTermoBusca] = useState('');
  
  const [menuAberto, setMenuAberto] = useState(false);

  const [idExcluir, setIdExcluir] = useState<string | null>(null);
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [loadingExclusao, setLoadingExclusao] = useState(false);

  // ESCUTA O STATUS DA SESSÃO/LOGIN NO SUPABASE
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregandoSessao(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCarregandoSessao(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      carregarDados();
      verificarUsuario();
    }
  }, [session]);

  const verificarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
      if (user.user_metadata?.role) {
        setUserRole(user.user_metadata.role as RoleUsuario);
      }
    }
  };

  const carregarDados = async () => {
    try {
      const { data: dataVeiculos, error: errV } = await supabase
        .from('veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (errV) throw errV;
      if (dataVeiculos) setVeiculos(dataVeiculos);

      const { data: dataDespesas, error: errD } = await supabase
        .from('despesas')
        .select('*')
        .order('created_at', { ascending: false });

      if (errD) throw errD;
      if (dataDespesas) setDespesas(dataDespesas);
    } catch (err: any) {
      toast.error(`Erro ao carregar dados: ${err.message}`);
    }
  };

  const handleNavegar = (aba: 'dashboard' | 'fila' | 'fechamento' | 'relatorios' | 'usuarios') => {
    setAbaAtiva(aba);
    setMenuAberto(false);
  };

  // SAIR / DESLOGAR
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sessão encerrada com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao encerrar sessão: ${err.message}`);
    }
  };

  const handleAdicionarVeiculo = async (novoVeiculo: Veiculo) => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .insert([{ ...novoVeiculo, fechado: false }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setVeiculos([data[0], ...veiculos]);
        toast.success(`Veículo ${novoVeiculo.modelo} cadastrado com sucesso!`);
      }
    } catch (err: any) {
      toast.error(`Erro ao cadastrar veículo: ${err.message}`);
    }
  };

  const handleTogglePagamento = async (id: string, statusAtual: boolean) => {
    try {
      const novoStatus = !statusAtual;
      const { error } = await supabase
        .from('veiculos')
        .update({ pago: novoStatus })
        .eq('id', id);

      if (error) throw error;

      setVeiculos(veiculos.map(v => (v.id === id ? { ...v, pago: novoStatus } : v)));
      if (novoStatus) {
        toast.success('Pagamento confirmado!');
      } else {
        toast.warning('Status alterado para Pendente.');
      }
    } catch (err: any) {
      toast.error(`Erro ao atualizar pagamento: ${err.message}`);
    }
  };

  const handleSolicitarExclusao = (id: string) => {
    setIdExcluir(id);
    setIsModalAberto(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!idExcluir) return;

    try {
      setLoadingExclusao(true);
      const { error } = await supabase.from('veiculos').delete().eq('id', idExcluir);

      if (error) throw error;

      setVeiculos(veiculos.filter(v => v.id !== idExcluir));
      toast.success('Veículo removido com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao remover veículo: ${err.message}`);
    } finally {
      setLoadingExclusao(false);
      setIsModalAberto(false);
      setIdExcluir(null);
    }
  };

  const handleAdicionarDespesa = async (novaDespesa: Omit<Despesa, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('despesas')
        .insert([{ ...novaDespesa, fechado: false }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setDespesas([data[0], ...despesas]);
        toast.success('Saída registrada com sucesso!');
      }
    } catch (err: any) {
      toast.error(`Erro ao registrar saída: ${err.message}`);
    }
  };

  const handleExcluirDespesa = async (id: string) => {
    try {
      const { error } = await supabase.from('despesas').delete().eq('id', id);
      if (error) throw error;

      setDespesas(despesas.filter(d => d.id !== id));
      toast.success('Saída removida do caixa.');
    } catch (err: any) {
      toast.error(`Erro ao remover saída: ${err.message}`);
    }
  };

  // TELA DE CARREGAMENTO INICIAL
  if (carregandoSessao) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>💧</span>
          <p style={{ fontWeight: '700', marginTop: '12px' }}>Carregando Lava-Rápido...</p>
        </div>
      </div>
    );
  }

  // SE NÃO HOUVER USUÁRIO LOGADO, EXIBE A TELA DE LOGIN
  if (!session) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Login />
      </>
    );
  }

  const veiculosAtivosNoPatio = veiculos.filter((v) => !v.pago || !v.fechado);

  const veiculosFiltrados = veiculosAtivosNoPatio.filter(
    (v) =>
      (v.modelo && v.modelo.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.categoria && v.categoria.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.cor && v.cor.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.empresa_contrato && v.empresa_contrato.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (v.lavador && v.lavador.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Toaster position="top-right" richColors />

      {/* BARRA SUPERIOR COM BOTÃO DE MENU E BOTÃO SAIR/TROCAR CONTA */}
      <header style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>💧</span>
          <span style={{ fontWeight: '800', fontSize: '16px' }}>Lava-Rápido</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {menuAberto ? '✕ Esconder' : '☰ Menu'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              backgroundColor: '#7f1d1d',
              color: '#fca5a5',
              border: '1px solid #991b1b',
              padding: '8px 12px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Sair / Trocar de Conta"
          >
            🚪 Sair
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* NAVEGAÇÃO LATERAL */}
        <aside style={{
          width: '260px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '24px 16px',
          display: menuAberto ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '24px',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 90,
          boxShadow: '4px 0 16px rgba(0,0,0,0.2)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>💧</span>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>Lava-Rápido</h1>
            </div>
            {userEmail && (
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', wordBreak: 'break-all' }}>
                👤 {userEmail}
              </span>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => handleNavegar('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'dashboard' ? '#1e293b' : 'transparent',
                color: abaAtiva === 'dashboard' ? '#38bdf8' : '#94a3b8',
                textAlign: 'left',
              }}
            >
              📊 Dashboard
            </button>

            <button
              onClick={() => handleNavegar('fila')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'fila' ? '#1e293b' : 'transparent',
                color: abaAtiva === 'fila' ? '#38bdf8' : '#94a3b8',
                textAlign: 'left',
              }}
            >
              🚗 Fila de Lavagem
            </button>

            <button
              onClick={() => handleNavegar('fechamento')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'fechamento' ? '#1e293b' : 'transparent',
                color: abaAtiva === 'fechamento' ? '#38bdf8' : '#94a3b8',
                textAlign: 'left',
              }}
            >
              💳 Fechamento / Caixa
            </button>

            <button
              onClick={() => handleNavegar('relatorios')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'relatorios' ? '#1e293b' : 'transparent',
                color: abaAtiva === 'relatorios' ? '#38bdf8' : '#94a3b8',
                textAlign: 'left',
              }}
            >
              📈 Relatórios Gerenciais
            </button>

            {userRole === 'dono' && (
              <button
                onClick={() => handleNavegar('usuarios')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: abaAtiva === 'usuarios' ? '#1e293b' : 'transparent',
                  color: abaAtiva === 'usuarios' ? '#38bdf8' : '#94a3b8',
                  textAlign: 'left',
                }}
              >
                👥 Usuários & Segurança
              </button>
            )}

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #991b1b',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                textAlign: 'left',
                marginTop: '16px'
              }}
            >
              🚪 Sair / Trocar de Conta
            </button>
          </nav>
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '20px', overflowY: 'auto', width: '100%' }}>
          
          {/* DASHBOARD PRINCIPAL */}
          {abaAtiva === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>DASHBOARD / ÁREA ADMINISTRATIVA</span>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>Dashboard Gerencial</h2>
              </div>

              <FechamentoSemanal
                veiculos={veiculos}
                despesas={despesas}
                onAdicionarDespesa={handleAdicionarDespesa}
                onExcluirDespesa={handleExcluirDespesa}
              />

              <FormularioVeiculo onAdicionarVeiculo={handleAdicionarVeiculo} userRole={userRole} />

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  Veículos em Pátio ({veiculosFiltrados.length})
                </h3>
                <ListaVeiculos
                  veiculos={veiculosFiltrados}
                  onTogglePagamento={handleTogglePagamento}
                  onExcluirVeiculo={handleSolicitarExclusao}
                  userRole={userRole}
                />
              </div>
            </div>
          )}

          {/* FILA DE LAVAGEM */}
          {abaAtiva === 'fila' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>PÁTIO / FILA DE ESPERA</span>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>
                    Veículos em Pátio ({veiculosFiltrados.length})
                  </h2>
                </div>

                <input
                  type="text"
                  placeholder="🔍 Buscar por modelo, cor, lavador..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    width: '100%',
                    maxWidth: '300px',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>

              <FormularioVeiculo onAdicionarVeiculo={handleAdicionarVeiculo} userRole={userRole} />

              <ListaVeiculos
                veiculos={veiculosFiltrados}
                onTogglePagamento={handleTogglePagamento}
                onExcluirVeiculo={handleSolicitarExclusao}
                userRole={userRole}
              />
            </div>
          )}

          {/* FECHAMENTO / CAIXA */}
          {abaAtiva === 'fechamento' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>FECHAMENTO & GESTÃO FINANCEIRA</span>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>Fechamento / Caixa</h2>
              </div>

              <FechamentoSemanal
                veiculos={veiculos}
                despesas={despesas}
                onAdicionarDespesa={handleAdicionarDespesa}
                onExcluirDespesa={handleExcluirDespesa}
              />
            </div>
          )}

          {/* RELATÓRIOS GERENCIAIS */}
          {abaAtiva === 'relatorios' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>HISTÓRICO & DESEMPENHO</span>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>Relatórios Gerenciais</h2>
              </div>

              <RelatorioGerencial veiculos={veiculos} despesas={despesas} userEmail={userEmail} />
            </div>
          )}

          {/* USUÁRIOS */}
          {abaAtiva === 'usuarios' && userRole === 'dono' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>ADMINISTRAÇÃO DE ACESSOS</span>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>Usuários & Segurança</h2>
              </div>

              <GestaoUsuarios />
            </div>
          )}
        </main>
      </div>

      <ConfirmModal
        isOpen={isModalAberto}
        title="Dar Baixa no Veículo"
        description="Tem certeza que deseja remover este veículo do pátio?"
        onConfirm={handleConfirmarExclusao}
        onClose={() => setIsModalAberto(false)}
        loading={loadingExclusao}
      />
    </div>
  );
}

export default App;