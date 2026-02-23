-- Esquema MySQL para módulo de comentários/avaliações
-- Execute com: mysql -u <usuario> -p < database/schema.mysql.sql

DROP DATABASE IF EXISTS site_comentarios;

-- Cria o banco
CREATE DATABASE site_comentarios
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usa o banco
USE site_comentarios;

-- ==============================
-- TABELA USUÁRIOS
-- ==============================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- TABELA COMENTÁRIOS
-- ==============================
CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    comentario TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- ==============================
-- TABELA AVALIAÇÕES (NOTAS 1 a 5)
-- ==============================
CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nota TINYINT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5)
);

-- ==============================
-- ÍNDICES (Melhora desempenho)
-- ==============================
CREATE INDEX idx_comentarios_usuario
ON comentarios(usuario_id);

CREATE INDEX idx_avaliacoes_usuario
ON avaliacoes(usuario_id);
