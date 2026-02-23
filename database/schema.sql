CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_usuario VARCHAR(120) NOT NULL,
  nota TINYINT UNSIGNED NOT NULL,
  comentario TEXT NOT NULL,
  data_avaliacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE INDEX idx_avaliacoes_data_avaliacao ON avaliacoes (data_avaliacao DESC);
