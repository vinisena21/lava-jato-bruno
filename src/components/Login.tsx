import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RoleUsuario } from '../types';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleUsuario>('funcionario');
  const [isRegistering, setIsRegistering] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Novo estado para controlar o "Olhinho" da senha
  const [showPassword, setShowPassword] = useState(false);

  const CHAVE_SECRETA_DO_DONO = 'VINICIUS2026'; // <--- SUA CHAVE MESTRA AQUI

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegistering) {
        // Bloqueio de segurança: Impede curiosos de criarem contas
        if (masterCode !== CHAVE_SECRETA_DO_DONO) {
          throw new Error('Chave Mestra incorreta! Apenas o dono pode registrar novos usuários.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        });
        
        if (error) throw error;
        
        alert('✅ Conta criada com sucesso! Você já pode acessar.');
        setIsRegistering(false);
        setMasterCode('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      
      {/* Coluna Esquerda - Dark Banner */}
      <div style={{ flex: 1.2, backgroundColor: '#0c232d', color: '#ffffff', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div style={{ backgroundColor: '#f59e0b', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              💧
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>Lava-Rápido</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Sistema de gestão interna</p>
            </div>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1.2, marginBottom: '28px', color: '#ffffff' }}>
            Controle total do pátio, do caixa e da equipe.
          </h1>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: '#cbd5e1' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>•</span> Registro de lavagens em segundos</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>•</span> Dashboard em tempo real com faturamento</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>•</span> Fechamento de despesas e caixa</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>•</span> Acesso blindado por Chave Mestra</li>
          </ul>
        </div>
      </div>

      {/* Coluna Direita - Formulário Card */}
      <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)', width: '100%', maxWidth: '420px' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              Acessar o sistema
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Entre com suas credenciais de colaborador.
            </p>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
            <button type="button" onClick={() => { setIsRegistering(false); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: !isRegistering ? '#ffffff' : 'transparent', color: !isRegistering ? '#0f172a' : '#64748b', boxShadow: !isRegistering ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Entrar
            </button>
            <button type="button" onClick={() => { setIsRegistering(true); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: isRegistering ? '#ffffff' : 'transparent', color: isRegistering ? '#0f172a' : '#64748b', boxShadow: isRegistering ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              Criar conta
            </button>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: '#fff1f2', color: '#e11d48', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fecdd3', fontWeight: '600' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#b45309', marginBottom: '6px', textTransform: 'uppercase' }}>
                  🔑 Chave Mestra do Dono
                </label>
                <input
                  type="password"
                  placeholder="Código de autorização"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value)}
                  required={isRegistering}
                  style={{ ...inputStyle, borderColor: '#fcd34d', backgroundColor: '#fffbeb' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>E-mail</label>
              <input type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  style={{ ...inputStyle, paddingRight: '44px' }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: 0,
                    color: '#64748b'
                  }}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Perfil de Acesso
                </label>
                <select value={role} onChange={(e) => setRole(e.target.value as RoleUsuario)} style={inputStyle}>
                  <option value="funcionario">Funcionário (Apenas Pátio)</option>
                  <option value="dono">Dono (Acesso Total)</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ backgroundColor: '#0e7490', color: '#ffffff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
              {loading ? 'Carregando...' : isRegistering ? 'Cadastrar Conta' : 'Entrar no Sistema'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}