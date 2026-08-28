import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CategoriaVeiculo, type Veiculo, type RoleUsuario } from '../types';
import { supabase } from '../lib/supabase';

interface FormularioProps {
  onAdicionarVeiculo: (veiculo: Veiculo) => void;
  userRole: RoleUsuario;
}

const mapearCategoriaPorNome = (nomeModelo: string): CategoriaVeiculo | null => {
  const nome = nomeModelo.toLowerCase().trim();

  if (['titan', 'fan', 'biz', 'factor', 'fazer', 'xre', 'twister', 'bros', 'pcx', 'nmax', 'cg 160', 'pop', 'cb', 'crosser'].some(k => nome.includes(k))) {
    return CategoriaVeiculo.MOTO;
  }
  if (['hilux', 'toro', 'ranger', 's10', 'amarok', 'montana', 'strada', 'saveiro', 'l200', 'frontier', 'ram', 'oroch'].some(k => nome.includes(k))) {
    return CategoriaVeiculo.CAMINHONETE;
  }
  if (['master', 'ducato', 'hr', 'sprinter', 'kombi', 'transit', 'jumper', 'boxer', 'fiorino'].some(k => nome.includes(k))) {
    return CategoriaVeiculo.VAN;
  }
  if (['corolla', 'civic', 'gol', 'onix', 'hb20', 'uno', 'palio', 'cruze', 'sentra', 'fit', 'yaris', 'polo', 'argo', 'compass', 'creta', 'renegade', 'kicks', 'tracker', 't-cross', 'fox', 'c3', 'ka', 'siena', 'voyage', 'city', 'etios', 'cobalt'].some(k => nome.includes(k))) {
    return CategoriaVeiculo.CARRO;
  }

  return null;
};

export function FormularioVeiculo({ onAdicionarVeiculo, userRole }: FormularioProps) {
  const [categoria, setCategoria] = useState<CategoriaVeiculo>(CategoriaVeiculo.CARRO);
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [valor, setValor] = useState('');
  const [lavador, setLavador] = useState('');
  
  const [eContrato, setEContrato] = useState(false);
  const [empresaContrato, setEmpresaContrato] = useState('');

  const [equipeDB, setEquipeDB] = useState<any[]>([]);
  const [modelosDB, setModelosDB] = useState<any[]>([]);
  const [coresDB, setCoresDB] = useState<any[]>([]);
  
  const [isEditingAtalhos, setIsEditingAtalhos] = useState(false);
  const [dropdownLavador, setDropdownLavador] = useState(false);
  
  const [isOutroModelo, setIsOutroModelo] = useState(false);
  const [isOutraCor, setIsOutraCor] = useState(false);
  
  const [novoLavador, setNovoLavador] = useState('');
  const [novoModelo, setNovoModelo] = useState('');
  const [novaCategoriaModelo, setNovaCategoriaModelo] = useState<CategoriaVeiculo>(CategoriaVeiculo.CARRO);
  const [novaCor, setNovaCor] = useState('');

  const [memoriaAtiva, setMemoriaAtiva] = useState(false);

  useEffect(() => {
    buscarAtalhos();
  }, []);

  useEffect(() => {
    if (modelo && !isEditingAtalhos) {
      const catSugerida = mapearCategoriaPorNome(modelo);
      if (catSugerida) {
        setCategoria(catSugerida);
      }
      buscarPrecoNaMemoria(modelo);
    }
  }, [modelo]);

  const buscarAtalhos = async () => {
    const { data: eq } = await supabase.from('equipe').select('*').order('nome');
    if (eq) setEquipeDB(eq);
    const { data: mod } = await supabase.from('modelos').select('*').order('nome');
    if (mod) setModelosDB(mod);
    const { data: c } = await supabase.from('cores').select('*').order('nome');
    if (c) setCoresDB(c);
  };

  const buscarPrecoNaMemoria = async (modeloBuscado: string) => {
    const { data } = await supabase
      .from('veiculos')
      .select('valor')
      .ilike('modelo', modeloBuscado)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0 && data[0].valor) {
      setValor(data[0].valor.toString());
      setMemoriaAtiva(true);
    } else {
      setValor('');
      setMemoriaAtiva(false);
    }
  };

  // Garante que BRUNO sempre esteja disponível na lista de lavadores
  const listaLavadoresOpcoes = Array.from(
    new Set(['BRUNO', ...equipeDB.map(e => e.nome.toUpperCase().trim())])
  );

  const toggleLavador = (nome: string) => {
    setLavador((prev) => {
      const atuais = prev.split('/').map(n => n.trim()).filter(Boolean);
      if (atuais.includes(nome)) {
        return atuais.filter(n => n !== nome).join(' / ');
      } else {
        return [...atuais, nome].join(' / ');
      }
    });
  };

  const handleAddEquipe = async () => {
    if (!novoLavador.trim()) {
      toast.warning('Digite o nome do membro da equipe.');
      return;
    }
    const { data, error } = await supabase.from('equipe').insert([{ nome: novoLavador.trim().toUpperCase() }]).select();
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    if (data) {
      setEquipeDB([...equipeDB, data[0]]);
      toast.success('Membro adicionado com sucesso!');
    }
    setNovoLavador('');
  };

  const handleDelEquipe = async (id: string) => {
    const { error } = await supabase.from('equipe').delete().eq('id', id);
    if (error) {
      toast.error(`Erro ao apagar: ${error.message}`);
    } else {
      setEquipeDB(equipeDB.filter(e => e.id !== id));
      toast.success('Membro removido.');
    }
  };

  const handleAddModel = async () => {
    if (!novoModelo.trim()) {
      toast.warning('Digite o nome do modelo.');
      return;
    }
    const { data, error } = await supabase
      .from('modelos')
      .insert([{ nome: novoModelo.trim(), categoria: novaCategoriaModelo }])
      .select();

    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    if (data) {
      setModelosDB([...modelosDB, data[0]]);
      toast.success('Modelo cadastrado com sucesso!');
    }
    setNovoModelo('');
  };

  const handleDelModel = async (id: string) => {
    const { error } = await supabase.from('modelos').delete().eq('id', id);
    if (error) {
      toast.error(`Erro ao apagar: ${error.message}`);
    } else {
      setModelosDB(modelosDB.filter(m => m.id !== id));
      toast.success('Modelo removido.');
    }
  };

  const handleAddCor = async () => {
    if (!novaCor.trim()) {
      toast.warning('Digite o nome da cor.');
      return;
    }
    const { data, error } = await supabase.from('cores').insert([{ nome: novaCor.trim() }]).select();
    if (error) {
      toast.error(`Erro ao salvar cor: ${error.message}`);
      return;
    }
    if (data) {
      setCoresDB([...coresDB, data[0]]);
      toast.success('Cor cadastrada com sucesso!');
    }
    setNovaCor('');
  };

  const handleDelCor = async (id: string) => {
    const { error } = await supabase.from('cores').delete().eq('id', id);
    if (error) {
      toast.error(`Erro ao apagar: ${error.message}`);
    } else {
      setCoresDB(coresDB.filter(c => c.id !== id));
      toast.success('Cor removida.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelo || !valor) {
      toast.warning('Preencha o modelo e o valor do serviço.');
      return;
    }

    onAdicionarVeiculo({
      placa: categoria, 
      modelo,
      cor: cor.trim(),
      categoria,
      valor: parseFloat(valor),
      pago: !eContrato,
      e_contrato: eContrato,
      empresa_contrato: eContrato ? empresaContrato : '',
      lavador: lavador.trim().toUpperCase(),
    });

    setModelo('');
    setCor('');
    setValor('');
    setLavador('');
    setEContrato(false);
    setEmpresaContrato('');
    setIsOutroModelo(false);
    setIsOutraCor(false);
    setMemoriaAtiva(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#ffffff',
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04)', marginBottom: '24px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', alignItems: 'end' }}>
        
        {/* 1. TIPO DE VEÍCULO */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tipo</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaVeiculo)} style={{ ...inputStyle, fontWeight: '700' }}>
            {Object.values(CategoriaVeiculo).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 2. MENU SUSPENSO: MODELO */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Modelo</label>
          
          {isOutroModelo ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="text" placeholder="Digite..." value={modelo} onChange={(e) => setModelo(e.target.value)} required style={inputStyle} autoFocus />
              <button type="button" onClick={() => { setIsOutroModelo(false); setModelo(''); setValor(''); setMemoriaAtiva(false); }} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 8px', cursor: 'pointer' }} title="Voltar para a lista">
                🔙
              </button>
            </div>
          ) : (
            <select 
              value={modelo} 
              onChange={(e) => {
                if (e.target.value === 'OUTRO_MODELO') {
                  setIsOutroModelo(true);
                  setModelo('');
                  setValor('');
                  setMemoriaAtiva(false);
                } else {
                  const nomeSelecionado = e.target.value;
                  setModelo(nomeSelecionado);
                  
                  const selecionadoDB = modelosDB.find(m => m.nome === nomeSelecionado);
                  if (selecionadoDB && selecionadoDB.categoria) {
                    setCategoria(selecionadoDB.categoria as CategoriaVeiculo);
                  } else {
                    const catAuto = mapearCategoriaPorNome(nomeSelecionado);
                    if (catAuto) setCategoria(catAuto);
                  }
                }
              }} 
              required 
              style={{ ...inputStyle, fontWeight: '700' }}
            >
              <option value="" disabled>Selecione...</option>
              {modelosDB.map((m) => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
              <option value="OUTRO_MODELO">➕ Outro (Digitar)...</option>
            </select>
          )}
        </div>

        {/* 3. MENU SUSPENSO: COR */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Cor</label>
          
          {isOutraCor ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="text" placeholder="Digite..." value={cor} onChange={(e) => setCor(e.target.value)} style={inputStyle} autoFocus />
              <button type="button" onClick={() => { setIsOutraCor(false); setCor(''); }} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 8px', cursor: 'pointer' }} title="Voltar para a lista">
                🔙
              </button>
            </div>
          ) : (
            <select 
              value={cor} 
              onChange={(e) => {
                if (e.target.value === 'OUTRA_COR') {
                  setIsOutraCor(true);
                  setCor('');
                } else {
                  setCor(e.target.value);
                }
              }} 
              style={{ ...inputStyle, fontWeight: '700' }}
            >
              <option value="" disabled>Selecione...</option>
              {coresDB.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
              <option value="OUTRA_COR">➕ Outra (Digitar)...</option>
            </select>
          )}
        </div>

        {/* 4. MENU SUSPENSO MÚLTIPLO: LAVADOR(ES) */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Lavador(es)</label>
          
          <div 
            onClick={() => setDropdownLavador(!dropdownLavador)}
            style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: dropdownLavador ? '1px solid #3b82f6' : '1px solid #cbd5e1' }}
          >
            <span style={{ color: lavador ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: lavador ? '700' : '400' }}>
              {lavador || 'Selecione...'}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
          </div>

          {dropdownLavador && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setDropdownLavador(false)} />
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 11, maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {listaLavadoresOpcoes.map(nomeLavador => {
                  const isSelected = lavador.split('/').map(n => n.trim()).includes(nomeLavador);
                  const isDono = nomeLavador === 'BRUNO' || nomeLavador === 'DONO';
                  return (
                    <label key={nomeLavador} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', borderRadius: '8px', backgroundColor: isSelected ? '#eff6ff' : 'transparent', transition: 'all 0.2s' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleLavador(nomeLavador)} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#1d4ed8' : '#334155' }}>
                        {nomeLavador} {isDono ? '👑 (Dono)' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 5. VALOR INTELIGENTE */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
            Valor (R$)
            {memoriaAtiva && (
              <span style={{ color: '#10b981', fontSize: '10px', textTransform: 'none' }}>✨ IA: Preço lembrado</span>
            )}
          </label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="50,00" 
            value={valor} 
            onChange={(e) => {
              setValor(e.target.value);
              setMemoriaAtiva(false);
            }} 
            required 
            style={{ 
              ...inputStyle, 
              borderColor: memoriaAtiva ? '#10b981' : '#cbd5e1', 
              backgroundColor: memoriaAtiva ? '#ecfdf5' : '#ffffff',
              fontWeight: '700',
              color: memoriaAtiva ? '#047857' : '#0f172a'
            }} 
          />
        </div>

        <button type="submit" style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '11px 16px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', height: '40px' }}>
          + Cadastrar
        </button>
      </div>

      {/* ÁREA DE CONFIGURAÇÕES */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', color: '#d97706' }}>
            <input type="checkbox" checked={eContrato} onChange={(e) => setEContrato(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} />
            📑 Veículo de Empresa / Convênio?
          </label>
          
          {userRole === 'dono' && (
            <button
              type="button"
              onClick={() => setIsEditingAtalhos(!isEditingAtalhos)}
              style={{ backgroundColor: isEditingAtalhos ? '#0f172a' : '#f1f5f9', color: isEditingAtalhos ? '#ffffff' : '#475569', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
            >
              {isEditingAtalhos ? '✅ Concluir Edição das Listas' : '⚙️ Editar Listas (Equipe, Modelos, Cores)'}
            </button>
          )}
        </div>

        {eContrato && (
          <input type="text" placeholder="Nome da Empresa (Ex: Ambulância, Master)" value={empresaContrato} onChange={(e) => setEmpresaContrato(e.target.value)} style={{ ...inputStyle, width: '280px', backgroundColor: '#fffbeb', borderColor: '#fcd34d' }} />
        )}

        {/* MODO DE EDIÇÃO DO ADMINISTRADOR */}
        {isEditingAtalhos && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            
            {/* Gerenciar Equipe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>🔧 Gerenciar Equipe:</span>
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {equipeDB.map(membro => (
                    <button key={membro.id} type="button" onClick={() => handleDelEquipe(membro.id)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: '700' }} title="Excluir">
                      ❌ {membro.nome}
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" placeholder="Novo membro..." value={novoLavador} onChange={(e) => setNovoLavador(e.target.value)} style={{ padding: '6px 10px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', width: '130px' }} />
                    <button type="button" onClick={handleAddEquipe} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Salvar</button>
                  </div>
               </div>
            </div>

            {/* Gerenciar Modelos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>🔧 Gerenciar Modelos:</span>
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {modelosDB.map(item => (
                    <button key={item.id} type="button" onClick={() => handleDelModel(item.id)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: '700' }} title="Excluir Modelo">
                      ❌ {item.nome} <span style={{ fontSize: '10px', color: '#64748b' }}>({item.categoria || 'Carro'})</span>
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" placeholder="Novo Modelo..." value={novoModelo} onChange={(e) => setNovoModelo(e.target.value)} style={{ padding: '6px 10px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', width: '130px' }} />
                    <select value={novaCategoriaModelo} onChange={(e) => setNovaCategoriaModelo(e.target.value as CategoriaVeiculo)} style={{ padding: '6px 8px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700' }}>
                      {Object.values(CategoriaVeiculo).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddModel} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Salvar</button>
                  </div>
               </div>
            </div>

            {/* Gerenciar Cores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
               <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>🔧 Gerenciar Cores:</span>
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {coresDB.map(c => (
                    <button key={c.id} type="button" onClick={() => handleDelCor(c.id)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: '700' }} title="Excluir">
                      ❌ {c.nome}
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" placeholder="Nova Cor..." value={novaCor} onChange={(e) => setNovaCor(e.target.value)} style={{ padding: '6px 10px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', width: '130px' }} />
                    <button type="button" onClick={handleAddCor} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Salvar</button>
                  </div>
               </div>
            </div>
            
          </div>
        )}
      </div>
    </form>
  );
}