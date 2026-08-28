import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { RoleUsuario } from '../types';

export function GestaoUsuarios() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<RoleUsuario>('funcionario');
  const [loading, setLoading] = useState(false);

  const [equipeDB, setEquipeDB] = useState<any[]>([]);

  useEffect(() => {
    buscarEquipe();
  }, []);

  const buscarEquipe = async () => {
    const { data } = await supabase.from('equipe').select('*').order('nome');
    if (data) setEquipeDB(data);
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.warning('Preencha o e-mail e a senha.');
      return;
    }

    if (senha.length < 6) {
      toast.warning('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      const supabaseUrl = (supabase as any).supabaseUrl;
      const supabaseKey = (supabase as any).supabaseKey;

      const tempSupabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      const { error } = await tempSupabase.auth.signUp({
        email: email.trim(),
        password: senha.trim(),
        options: {
          data: {
            role: role,
          }
        }
      });

      if (error) throw error;

      toast.success(`Usuário ${email} cadastrado com sucesso como ${role === 'dono' ? 'Administrador' : 'Colaborador'}!`);
      setEmail('');
      setSenha('');
      setRole('funcionario');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta de usuário.');
    } finally {
      setLoading(false);
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
    fontWeight: '600',
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* FORMULÁRIO DE NOVO USUÁRIO */}
        <form onSubmit={handleCriarUsuario} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 Criar Novo Acesso ao Sistema
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>E-mail de Login</label>
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
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Senha de Acesso</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Nível de Permissão</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleUsuario)}
                style={{ ...inputStyle, fontWeight: '700' }}
              >
                <option value="funcionario">👤 Colaborador (Acesso apenas à Fila do Pátio)</option>
                <option value="dono">👑 Administrador (Acesso Total ao Caixa e Relatórios)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 16px',
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
          </div>
        </form>

        {/* LISTA DE INTEGRANTES CADASTRADOS NA EQUIPE */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Equipe de Lavadores
          </h3>

          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', fontWeight: '600' }}>
            Nomes cadastrados para aparecer nos botões de seleção de lavador do formulário:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>👑 BRUNO</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e40af', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '12px' }}>Dono / Administrador</span>
            </div>

            {equipeDB.map((membro) => (
              <div key={membro.id} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>👤 {membro.nome}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>Colaborador</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}