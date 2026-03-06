-- Tabla de usuarios (debe crearse PRIMERO)
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    correo VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    pass VARCHAR(255),
    rol VARCHAR(50)
);

-- Tabla de negocios (depende de usuarios)
CREATE TABLE negocios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    nombre_empresa VARCHAR(255),
    categoria_empresa VARCHAR(255),
    telefono_empresa VARCHAR(20),
    direccion_empresa VARCHAR(255),
    horario_empresa VARCHAR(255),
    correo_empresa VARCHAR(255),
    ine_url_representante TEXT,
    descripcion_empresa TEXT,
    fotos_url_empresa TEXT,
    logo_url_empresa VARCHAR(255),
    latitud DOUBLE,
    longitud DOUBLE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Tabla de opiniones (depende de usuarios)
CREATE TABLE opinion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    lugar_id VARCHAR(255) NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    texto TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de sucursales (depende de negocios)
CREATE TABLE sucursales (
    id_sucursal BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_negocio BIGINT NOT NULL,
    latitud DOUBLE NOT NULL,
    longitud DOUBLE NOT NULL,
    direccion VARCHAR(255),
    FOREIGN KEY (id_negocio) REFERENCES negocios(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_negocios_usuario_id ON negocios(id_usuario);
CREATE INDEX idx_opinion_usuario_id ON opinion(usuario_id);
CREATE INDEX idx_opinion_lugar_id ON opinion(lugar_id);
CREATE INDEX idx_sucursales_negocio_id ON sucursales(id_negocio);