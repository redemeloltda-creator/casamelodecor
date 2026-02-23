-- Esquema PostgreSQL/Supabase para comentários e notas de clientes
-- Execute conectado ao banco desejado (ex.: psql -d casamelodecor -f database/schema.sql)

-- Projeto Supabase: fulymepfkdenmtickfwk
-- Host do banco (Supabase): db.fulymepfkdenmtickfwk.supabase.co
-- Exemplo de conexão direta:
-- psql "postgresql://postgres:<SUA_SENHA>@db.fulymepfkdenmtickfwk.supabase.co:5432/postgres?sslmode=require" -f database/schema.sql

-- Tabela pública usada pelo front-end para salvar comentários diretamente com a chave publishable.
CREATE TABLE IF NOT EXISTS comentarios_publicos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  celular VARCHAR(20),
  foto TEXT,
  nota SMALLINT NOT NULL,
  comentario TEXT NOT NULL,
  data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_comentarios_publicos_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT chk_comentarios_publicos_comentario CHECK (length(btrim(comentario)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_comentarios_publicos_data ON comentarios_publicos (data_avaliacao DESC);

ALTER TABLE comentarios_publicos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comentarios_publicos' AND policyname = 'comentarios_publicos_select'
  ) THEN
    CREATE POLICY comentarios_publicos_select
      ON comentarios_publicos FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comentarios_publicos' AND policyname = 'comentarios_publicos_insert'
  ) THEN
    CREATE POLICY comentarios_publicos_insert
      ON comentarios_publicos FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comentarios_publicos' AND policyname = 'comentarios_publicos_update'
  ) THEN
    CREATE POLICY comentarios_publicos_update
      ON comentarios_publicos FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comentarios_publicos' AND policyname = 'comentarios_publicos_delete'
  ) THEN
    CREATE POLICY comentarios_publicos_delete
      ON comentarios_publicos FOR DELETE
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comentarios_publicos TO anon, authenticated;
