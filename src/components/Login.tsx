import React, { useState, useEffect } from 'react';
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
  const [successMsg, setSuccessMsg] = useState('');
  
  // Novo estado para controlar o "Olhinho" da senha
  const [showPassword, setShowPassword] = useState(false);

  // Estados para "Esqueci minha senha"
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Estado para "Redefinir senha" (quando clica no link do e-mail)
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const CHAVE_SECRETA_DO_DONO = 'VINICIUS2026'; // <--- SUA CHAVE MESTRA AQUI

  // Detectar quando o usuário volta pelo link de redefinição do e-mail
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setForgotPassword(false);
        setIsRegistering(false);
        setErrorMsg('');
        setSuccessMsg('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enviar e-mail de redefinição
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;

      setSuccessMsg(
        '✅ E-mail enviado! Verifique sua caixa de entrada (e o spam) para redefinir sua senha.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar e-mail de redefinição.');
    } finally {
      setLoading(false);
    }
  };

  // Salvar nova senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccessMsg('✅ Senha redefinida com sucesso! Entrando no sistema...');
      setIsResettingPassword(false);
      // O onAuthStateChange do App.tsx vai pegar a sessão e redirecionar automaticamente
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

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

  // ========== TELA: REDEFINIR SENHA (quando volta pelo link do e-mail) ==========
  if (isResettingPassword) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
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
              Defina sua nova senha.
            </h1>
            <p style={{ fontSize: '15px', color: '#cbd5e1' }}>
              Digite uma nova senha segura abaixo para recuperar o acesso ao sistema.
            </p>
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)', width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                🔐 Nova Senha
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Escolha uma senha forte com no mínimo 6 caracteres.
              </p>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fff1f2', color: '#e11d48', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fecdd3', fontWeight: '600' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #bbf7d0', fontWeight: '600' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Nova Senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={{ backgroundColor: '#16a34a', color: '#ffffff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
                {loading ? 'Salvando...' : '✅ Salvar Nova Senha'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ========== TELA: ESQUECI MINHA SENHA ==========
  if (forgotPassword) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
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
              Recupere o acesso ao sistema.
            </h1>
            <p style={{ fontSize: '15px', color: '#cbd5e1' }}>
              Enviaremos um link para o seu e-mail para você redefinir a senha de forma segura.
            </p>
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)', width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                📧 Recuperar Senha
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Digite o e-mail vinculado à sua conta.
              </p>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fff1f2', color: '#e11d48', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fecdd3', fontWeight: '600' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #bbf7d0', fontWeight: '600' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>E-mail</label>
                <input
                  type="email"
                  placeholder="voce@empresa.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={{ backgroundColor: '#0e7490', color: '#ffffff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
                {loading ? 'Enviando...' : '📩 Enviar Link de Recuperação'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => { setForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#0e7490', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                ← Voltar para o Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== TELA: LOGIN / REGISTRO (original) ==========
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
                  {showPassword ? '🙈' : '👁️  '}
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

          {/* Link "Esqueci minha senha" - só aparece na aba de login */}
          {!isRegistering && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setResetEmail(email); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}