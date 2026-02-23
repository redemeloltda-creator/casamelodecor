-- Esquema PostgreSQL/Supabase para comentários e notas de clientes
-- Execute conectado ao banco desejado (ex.: psql -d casamelodecor -f database/schema.sql)

-- Tabela de usuários vinculada ao auth.users do Supabase.
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  celular VARCHAR(20),
  foto TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_usuarios_nome CHECK (length(btrim(nome)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios (nome);
CREATE INDEX IF NOT EXISTS idx_usuarios_celular ON usuarios (celular);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nota SMALLINT NOT NULL,
  comentario TEXT NOT NULL,
  data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT chk_avaliacoes_comentario CHECK (length(btrim(comentario)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_data_avaliacao ON avaliacoes (data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario_id ON avaliacoes (usuario_id);

-- Proteção contra SQL Injection
-- 1) Nunca concatenar dados de usuário diretamente em SQL.
-- 2) Executar somente função/procedure com parâmetros tipados.

CREATE OR REPLACE PROCEDURE sp_criar_avaliacao (
  IN p_usuario_id UUID,
  IN p_nota SMALLINT,
  IN p_comentario TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_nota < 1 OR p_nota > 5 THEN
    RAISE EXCEPTION 'Nota deve estar entre 1 e 5';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado na tabela usuarios';
  END IF;

  INSERT INTO avaliacoes (usuario_id, nota, comentario)
  VALUES (p_usuario_id, p_nota, btrim(p_comentario));
END;
$$;

CREATE OR REPLACE FUNCTION sp_buscar_avaliacoes_por_usuario (
  p_usuario_id UUID
)
RETURNS TABLE (
  id BIGINT,
  usuario_id UUID,
  nome_usuario VARCHAR(120),
  nota SMALLINT,
  comentario TEXT,
  data_avaliacao TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    a.id,
    a.usuario_id,
    u.nome AS nome_usuario,
    a.nota,
    a.comentario,
    a.data_avaliacao
  FROM avaliacoes AS a
  INNER JOIN usuarios AS u ON u.id = a.usuario_id
  WHERE a.usuario_id = p_usuario_id
  ORDER BY a.data_avaliacao DESC;
$$;

CREATE OR REPLACE FUNCTION sp_buscar_avaliacoes_publicas ()
RETURNS TABLE (
  id BIGINT,
  usuario_id UUID,
  nome_usuario VARCHAR(120),
  foto_usuario TEXT,
  nota SMALLINT,
  comentario TEXT,
  data_avaliacao TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    a.id,
    a.usuario_id,
    u.nome AS nome_usuario,
    u.foto AS foto_usuario,
    a.nota,
    a.comentario,
    a.data_avaliacao
  FROM avaliacoes AS a
  INNER JOIN usuarios AS u ON u.id = a.usuario_id
  ORDER BY a.data_avaliacao DESC;
$$;

-- Exemplo de concessão de menor privilégio para a aplicação:
-- GRANT USAGE ON SCHEMA public TO casamelo_app;
-- GRANT SELECT, INSERT, UPDATE ON usuarios TO casamelo_app;
-- GRANT EXECUTE ON PROCEDURE sp_criar_avaliacao(UUID, SMALLINT, TEXT) TO casamelo_app;
-- GRANT EXECUTE ON FUNCTION sp_buscar_avaliacoes_por_usuario(UUID) TO casamelo_app;
-- GRANT EXECUTE ON FUNCTION sp_buscar_avaliacoes_publicas() TO casamelo_app;
-- Não conceder INSERT/UPDATE/DELETE direto em avaliacoes para esse usuário.
