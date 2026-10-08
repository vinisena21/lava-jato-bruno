-- ============================================================
-- POLÍTICAS DE SEGURANÇA RLS — Lava-Jato Bruno
-- Execute este script no Supabase: SQL Editor > New Query
-- ============================================================

-- ============================================================
-- PASSO 1: Habilitar RLS em todas as tabelas
-- ============================================================

ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASSO 2: Função auxiliar para buscar o role do usuário logado
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM perfis_usuarios
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1;
$$;

-- ============================================================
-- PASSO 3: Políticas para a tabela VEICULOS
-- Dono e Gerente: acesso total | Funcionário: apenas leitura
-- ============================================================

DROP POLICY IF EXISTS "veiculos_select" ON veiculos;
DROP POLICY IF EXISTS "veiculos_insert" ON veiculos;
DROP POLICY IF EXISTS "veiculos_update" ON veiculos;
DROP POLICY IF EXISTS "veiculos_delete" ON veiculos;

-- Todos os usuários autenticados podem ver veículos
CREATE POLICY "veiculos_select" ON veiculos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas dono e gerente podem inserir
CREATE POLICY "veiculos_insert" ON veiculos
  FOR INSERT WITH CHECK (
    get_user_role() IN ('dono', 'gerente', 'funcionario')
  );

-- Apenas dono e gerente podem atualizar
CREATE POLICY "veiculos_update" ON veiculos
  FOR UPDATE USING (
    get_user_role() IN ('dono', 'gerente')
  );

-- Apenas dono pode excluir
CREATE POLICY "veiculos_delete" ON veiculos
  FOR DELETE USING (
    get_user_role() = 'dono'
  );

-- ============================================================
-- PASSO 4: Políticas para a tabela DESPESAS
-- Apenas o dono tem acesso total
-- ============================================================

DROP POLICY IF EXISTS "despesas_select" ON despesas;
DROP POLICY IF EXISTS "despesas_insert" ON despesas;
DROP POLICY IF EXISTS "despesas_delete" ON despesas;

CREATE POLICY "despesas_select" ON despesas
  FOR SELECT USING (get_user_role() = 'dono');

CREATE POLICY "despesas_insert" ON despesas
  FOR INSERT WITH CHECK (get_user_role() = 'dono');

CREATE POLICY "despesas_delete" ON despesas
  FOR DELETE USING (get_user_role() = 'dono');

-- ============================================================
-- PASSO 5: Políticas para PERFIS_USUARIOS
-- Apenas o dono pode ver e alterar permissões
-- ============================================================

DROP POLICY IF EXISTS "perfis_select" ON perfis_usuarios;
DROP POLICY IF EXISTS "perfis_insert" ON perfis_usuarios;
DROP POLICY IF EXISTS "perfis_update" ON perfis_usuarios;

-- Usuário pode ver apenas o próprio perfil (para login)
CREATE POLICY "perfis_select_proprio" ON perfis_usuarios
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR get_user_role() = 'dono'
  );

-- Apenas o dono pode criar ou alterar perfis
CREATE POLICY "perfis_insert" ON perfis_usuarios
  FOR INSERT WITH CHECK (get_user_role() = 'dono');

CREATE POLICY "perfis_update" ON perfis_usuarios
  FOR UPDATE USING (get_user_role() = 'dono');

-- ============================================================
-- PASSO 6: Políticas para EQUIPE, MODELOS, CORES
-- Leitura: todos | Escrita: dono e gerente
-- ============================================================

-- EQUIPE
DROP POLICY IF EXISTS "equipe_select" ON equipe;
DROP POLICY IF EXISTS "equipe_write" ON equipe;

CREATE POLICY "equipe_select" ON equipe
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "equipe_insert" ON equipe
  FOR INSERT WITH CHECK (get_user_role() IN ('dono', 'gerente'));

CREATE POLICY "equipe_delete" ON equipe
  FOR DELETE USING (get_user_role() IN ('dono', 'gerente'));

-- MODELOS
DROP POLICY IF EXISTS "modelos_select" ON modelos;
DROP POLICY IF EXISTS "modelos_insert" ON modelos;
DROP POLICY IF EXISTS "modelos_delete" ON modelos;

CREATE POLICY "modelos_select" ON modelos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "modelos_insert" ON modelos
  FOR INSERT WITH CHECK (get_user_role() IN ('dono', 'gerente'));

CREATE POLICY "modelos_delete" ON modelos
  FOR DELETE USING (get_user_role() IN ('dono', 'gerente'));

-- CORES
DROP POLICY IF EXISTS "cores_select" ON cores;
DROP POLICY IF EXISTS "cores_insert" ON cores;
DROP POLICY IF EXISTS "cores_delete" ON cores;

CREATE POLICY "cores_select" ON cores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cores_insert" ON cores
  FOR INSERT WITH CHECK (get_user_role() IN ('dono', 'gerente'));

CREATE POLICY "cores_delete" ON cores
  FOR DELETE USING (get_user_role() IN ('dono', 'gerente'));

-- ============================================================
-- CONCLUÍDO! Verifique as políticas em:
-- Authentication > Policies no painel do Supabase
-- ============================================================
