use smartcash;
ALTER TABLE usuario
ADD COLUMN foto VARCHAR(255) DEFAULT NULL;

describe usuario;

UPDATE usuario
SET foto = 'imagens/avatar.png'
WHERE ID = 1;