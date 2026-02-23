CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_usuario VARCHAR(120) NOT NULL,
  nota TINYINT UNSIGNED NOT NULL,
  comentario TEXT NOT NULL,
  data_avaliacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE INDEX idx_avaliacoes_data_avaliacao ON avaliacoes (data_avaliacao DESC);

-- Proteção contra SQL Injection
-- 1) Nunca concatenar dados de usuário diretamente em SQL.
-- 2) Executar somente procedures com parâmetros tipados.

DELIMITER $$

CREATE PROCEDURE sp_criar_avaliacao (
  IN p_nome_usuario VARCHAR(120),
  IN p_nota TINYINT UNSIGNED,
  IN p_comentario TEXT
)
BEGIN
  IF p_nota < 1 OR p_nota > 5 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nota deve estar entre 1 e 5';
  END IF;

  INSERT INTO avaliacoes (nome_usuario, nota, comentario)
  VALUES (TRIM(p_nome_usuario), p_nota, p_comentario);
END$$

CREATE PROCEDURE sp_buscar_avaliacoes_por_nome (
  IN p_nome_usuario VARCHAR(120)
)
BEGIN
  SELECT
    id,
    nome_usuario,
    nota,
    comentario,
    data_avaliacao
  FROM avaliacoes
  WHERE nome_usuario = TRIM(p_nome_usuario)
  ORDER BY data_avaliacao DESC;
END$$

DELIMITER ;

-- Exemplo de concessão de menor privilégio para a aplicação:
-- GRANT EXECUTE ON PROCEDURE sp_criar_avaliacao TO 'casamelo_app'@'%';
-- GRANT EXECUTE ON PROCEDURE sp_buscar_avaliacoes_por_nome TO 'casamelo_app'@'%';
-- Não conceder INSERT/UPDATE/DELETE direto na tabela para esse usuário.
