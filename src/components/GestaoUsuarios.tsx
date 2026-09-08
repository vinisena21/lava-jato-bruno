import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { RoleUsuario } from '../types';

export function GestaoUsuarios() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<RoleUsuario>('funcionario');
  const [loading, setLoading] = useState(false);

  const [nomeLavador, setNomeLavador] = useState('');
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loadingEquipe, setLoadingEquipe] = useState(false);

  useEffect(() => {
    carregarEquipe();
  }, []);

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { role },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success(`Usuário ${email} criado com nível: ${role.toUpperCase()}`);
        setEmail('');
        setSenha('');
        setRole('funcionario');
      }
    } catch (err: any) {
      toast.error(`Erro ao criar acesso: ${err.message}`);
    } finally {
      setLoading(false);
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
      
      {/* FORMULÁRIO DE CRIAR ACESSO AO SISTEMA */}
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
              Nível de Permissão
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleUsuario)}
              style={{ ...inputStyle, fontWeight: '700' }}
            >
              <option value="funcionario">👤 Colaborador (Acesso apenas à Fila do Pátio)</option>
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
  );
}