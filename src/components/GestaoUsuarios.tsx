import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { RoleUsuario } from '../types';

interface PerfilUsuario {
  id: string;
  email: string;
  role: RoleUsuario;
}

export function GestaoUsuarios() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<RoleUsuario>('funcionario');
  const [loading, setLoading] = useState(false);

  // Lista de Usuários e Permissões
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Equipe de Lavadores
  const [nomeLavador, setNomeLavador] = useState('');
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loadingEquipe, setLoadingEquipe] = useState(false);

  useEffect(() => {
    carregarEquipe();
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const { data, error } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .order('email');

      if (error) throw error;
      if (data) setUsuarios(data as PerfilUsuario[]);
    } catch (err: any) {
      toast.error(`Erro ao carregar usuários: ${err.message}`);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const carregarEquipe = async () => {
    try {
      const { data, error } = await supabase.from('equipe').select('*').order('nome');
      if (error) throw error;
      if (data) setEquipe(data);
    } catch (err: any) {
      toast.error(`Erro ao carregar lavadores: ${err.message}`);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.warning('Preencha o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);

      // 1. Cria a conta no Auth do Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { role },
        },
      });

      if (error) throw error;

      // 2. Registra na tabela de perfis de permissão
      await supabase.from('perfis_usuarios').upsert(
        [{ email, role }],
        { onConflict: 'email' }
      );

      toast.success(`Usuário ${email} cadastrado como ${role.toUpperCase()}!`);
      setEmail('');
      setSenha('');
      setRole('funcionario');
      carregarUsuarios();
    } catch (err: any) {
      toast.error(`Erro ao criar acesso: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Alterar permissão de um usuário existente
  const handleAlterarRole = async (userEmail: string, novaRole: RoleUsuario) => {
    try {
      const { error } = await supabase
        .from('perfis_usuarios')
        .upsert([{ email: userEmail, role: novaRole }], { onConflict: 'email' });

      if (error) throw error;

      setUsuarios(
        usuarios.map((u) => (u.email === userEmail ? { ...u, role: novaRole } : u))
      );
      toast.success(`Permissão de ${userEmail} alterada para ${novaRole.toUpperCase()}!`);
    } catch (err: any) {
      toast.error(`Erro ao atualizar permissão: ${err.message}`);
    }
  };

  const handleAdicionarLavador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLavador.trim()) return;

    try {
      setLoadingEquipe(true);
      const { data, error } = await supabase
        .from('equipe')
        .insert([{ nome: nomeLavador.trim().toUpperCase() }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEquipe([...equipe, data[0]]);
        toast.success(`Lavador ${nomeLavador.toUpperCase()} cadastrado!`);
        setNomeLavador('');
      }
    } catch (err: any) {
      toast.error(`Erro ao cadastrar lavador: ${err.message}`);
    } finally {
      setLoadingEquipe(false);
    }
  };

  const handleRemoverLavador = async (id: string, nome: string) => {
    try {
      const { error } = await supabase.from('equipe').delete().eq('id', id);
      if (error) throw error;

      setEquipe(equipe.filter((item) => item.id !== id));
      toast.success(`Lavador ${nome} removido.`);
    } catch (err: any) {
      toast.error(`Erro ao remover lavador: ${err.message}`);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#ffffff',
    fontWeight: '600',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* FORMULÁRIO DE CRIAR NOVO ACESSO */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 Criar Novo Acesso ao Sistema
          </h3>

          <form onSubmit={handleCriarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                E-mail de Login
              </label>
              <input
                type="email"
                placeholder="exemplo@lavajato.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Senha de Acesso
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Nível de Permissão Inicial
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleUsuario)}
                style={{ ...inputStyle, fontWeight: '700' }}
              >
                <option value="funcionario">👤 Colaborador (Apenas Fila do Pátio)</option>
                <option value="gerente">🛠️ Gerente (Pátio, Equipe, Modelos e Cores)</option>
                <option value="dono">👑 Administrador (Acesso Total ao Caixa e Relatórios)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '800',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
            >
              {loading ? 'Cadastrando...' : '+ Cadastrar Novo Acesso'}
            </button>
          </form>
        </div>

        {/* CADASTRO DE EQUIPE DE LAVADORES */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Equipe de Lavadores
          </h3>

          <form onSubmit={handleAdicionarLavador} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nome do novo lavador (Ex: RAFA)"
              value={nomeLavador}
              onChange={(e) => setNomeLavador(e.target.value)}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={loadingEquipe}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Adicionar
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {equipe.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Nenhum lavador cadastrado.</p>
            ) : (
              equipe.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  <span>👤 {item.nome}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoverLavador(item.id, item.nome)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* GERENCIAMENTO DE NÍVEL DE PERMISSÃO DOS USUÁRIOS JÁ CADASTRAIS */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔐 Alterar Permissão de Usuários Existentes
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
          Altere aqui a qualquer momento quem é Colaborador, Gerente ou Administrador do sistema.
        </p>

        {loadingUsuarios ? (
          <p style={{ fontSize: '13px', color: '#64748b' }}>Carregando lista de usuários...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {usuarios.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Nenhum usuário registrado na tabela ainda. Ao fazerem login ou ao cadastrar novos, eles aparecerão aqui.
              </p>
            ) : (
              usuarios.map((u) => (
                <div
                  key={u.id || u.email}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      ✉️ {u.email}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Nível:
                    </label>
                    <select
                      value={u.role}
                      onChange={(e) => handleAlterarRole(u.email, e.target.value as RoleUsuario)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontWeight: '800',
                        fontSize: '12px',
                        backgroundColor: u.role === 'dono' ? '#fef3c7' : u.role === 'gerente' ? '#e0f2fe' : '#ffffff',
                        color: u.role === 'dono' ? '#b45309' : u.role === 'gerente' ? '#0369a1' : '#334155',
                      }}
                    >
                      <option value="funcionario">👤 Colaborador</option>
                      <option value="gerente">🛠️ Gerente</option>
                      <option value="dono">👑 Administrador (Dono)</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}