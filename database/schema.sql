-- Esquema PostgreSQL para comentários e notas de clientes
-- Execute conectado ao banco desejado (ex.: psql -d casamelodecor -f database/schema.sql)

CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_usuario VARCHAR(120) NOT NULL,
  nota SMALLINT NOT NULL,
  comentario TEXT NOT NULL,
  data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT chk_avaliacoes_nome_usuario CHECK (length(btrim(nome_usuario)) > 0),
  CONSTRAINT chk_avaliacoes_comentario CHECK (length(btrim(comentario)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_data_avaliacao ON avaliacoes (data_avaliacao DESC);

-- Proteção contra SQL Injection
-- 1) Nunca concatenar dados de usuário diretamente em SQL.
-- 2) Executar somente função/procedure com parâmetros tipados.

CREATE OR REPLACE PROCEDURE sp_criar_avaliacao (
  IN p_nome_usuario VARCHAR(120),
  IN p_nota SMALLINT,
  IN p_comentario TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_nota < 1 OR p_nota > 5 THEN
    RAISE EXCEPTION 'Nota deve estar entre 1 e 5';
  END IF;

  INSERT INTO avaliacoes (nome_usuario, nota, comentario)
  VALUES (btrim(p_nome_usuario), p_nota, btrim(p_comentario));
END;
$$;

CREATE OR REPLACE FUNCTION sp_buscar_avaliacoes_por_nome (
  p_nome_usuario VARCHAR(120)
)
RETURNS TABLE (
  id BIGINT,
  nome_usuario VARCHAR(120),
  nota SMALLINT,
  comentario TEXT,
  data_avaliacao TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    a.id,
    a.nome_usuario,
    a.nota,
    a.comentario,
    a.data_avaliacao
  FROM avaliacoes AS a
  WHERE a.nome_usuario = btrim(p_nome_usuario)
  ORDER BY a.data_avaliacao DESC;
$$;

-- Exemplo de concessão de menor privilégio para a aplicação:
-- GRANT USAGE ON SCHEMA public TO casamelo_app;
-- GRANT EXECUTE ON PROCEDURE sp_criar_avaliacao(VARCHAR, SMALLINT, TEXT) TO casamelo_app;
-- GRANT EXECUTE ON FUNCTION sp_buscar_avaliacoes_por_nome(VARCHAR) TO casamelo_app;
-- Não conceder INSERT/UPDATE/DELETE direto na tabela para esse usuário.
