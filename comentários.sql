-- Estrutura SQL local para comentários (sem dependências do Supabase)

CREATE TABLE IF NOT EXISTS comentarios (
  id TEXT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  celular VARCHAR(20),
  foto TEXT,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  data_avaliacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_data_avaliacao
  ON comentarios (data_avaliacao DESC);
