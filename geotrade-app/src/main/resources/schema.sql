-- Tabla para opiniones/reviews
CREATE TABLE opinion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    lugar_id VARCHAR(255) NOT NULL, -- place_id de Google o id de negocio
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    texto TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_opinion_usuario_id ON opinion(usuario_id);
CREATE INDEX idx_opinion_lugar_id ON opinion(lugar_id);