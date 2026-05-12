-- ============================================================
-- SCHEMA: Centro Deportivo
-- Base de datos PostgreSQL
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: usuarios (clientes)
-- ============================================================
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100) NOT NULL,
  dni           VARCHAR(20)  UNIQUE NOT NULL,
  fecha_nac     DATE         NOT NULL,
  reset_token   TEXT,                        -- token para recuperar contraseña
  reset_expires TIMESTAMPTZ,                 -- expiración del token
  creado_en     TIMESTAMPTZ  DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: deportes
-- ============================================================
CREATE TABLE deportes (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(50) UNIQUE NOT NULL,  -- Fútbol, Tenis, Baloncesto, Voleibol
  descripcion   TEXT,
  precio_mes    NUMERIC(8,2) NOT NULL,        -- tarifa mensual
  precio_anual  NUMERIC(8,2) NOT NULL,        -- tarifa anual (descuento incluido)
  imagen_url    TEXT,
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: profesores
-- ============================================================
CREATE TABLE profesores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100) NOT NULL,
  dni           VARCHAR(20)  UNIQUE NOT NULL,
  deporte_id    INT NOT NULL REFERENCES deportes(id) ON DELETE RESTRICT,
  bio           TEXT,
  imagen_url    TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: suscripciones
-- ============================================================
CREATE TABLE suscripciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  deporte_id      INT  NOT NULL REFERENCES deportes(id)  ON DELETE RESTRICT,
  modalidad       VARCHAR(10) NOT NULL CHECK (modalidad IN ('mensual','anual')),
  precio_pagado   NUMERIC(8,2) NOT NULL,
  estado          VARCHAR(15) NOT NULL DEFAULT 'activa'
                    CHECK (estado IN ('activa','cancelada','expirada')),
  fecha_inicio    DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       DATE        NOT NULL,       -- calculado al insertar
  cancelada_en    TIMESTAMPTZ,               -- cuándo se canceló (si aplica)
  creado_en       TIMESTAMPTZ DEFAULT NOW()
);

-- Un usuario solo puede tener UNA suscripción activa por deporte.
-- El índice parcial (WHERE estado = 'activa') lo garantiza de forma eficiente
-- sin necesidad de la extensión btree_gist.
CREATE UNIQUE INDEX uq_usuario_deporte_activa
  ON suscripciones (usuario_id, deporte_id)
  WHERE (estado = 'activa');

-- Índices para consultas frecuentes
CREATE INDEX idx_suscripciones_usuario  ON suscripciones(usuario_id);
CREATE INDEX idx_suscripciones_deporte  ON suscripciones(deporte_id);
CREATE INDEX idx_suscripciones_estado   ON suscripciones(estado);

-- ============================================================
-- TABLA: reservas
-- ============================================================
CREATE TABLE reservas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id)    ON DELETE CASCADE,
  deporte_id      INT  NOT NULL REFERENCES deportes(id)    ON DELETE RESTRICT,
  profesor_id     UUID NOT NULL REFERENCES profesores(id)  ON DELETE RESTRICT,
  suscripcion_id  UUID NOT NULL REFERENCES suscripciones(id) ON DELETE RESTRICT,
  fecha_clase     TIMESTAMPTZ NOT NULL,
  duracion_min    INT NOT NULL DEFAULT 60,
  estado          VARCHAR(15) NOT NULL DEFAULT 'confirmada'
                    CHECK (estado IN ('confirmada','cancelada','completada')),
  notas           TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  -- Evitar que el mismo alumno reserve dos clases solapadas
  CONSTRAINT uq_usuario_fecha
    UNIQUE (usuario_id, fecha_clase)
);

CREATE INDEX idx_reservas_usuario   ON reservas(usuario_id);
CREATE INDEX idx_reservas_profesor  ON reservas(profesor_id);
CREATE INDEX idx_reservas_fecha     ON reservas(fecha_clase);

-- ============================================================
-- DATOS INICIALES: deportes
-- ============================================================
INSERT INTO deportes (nombre, descripcion, precio_mes, precio_anual, imagen_url) VALUES
  ('Fútbol',      'Entrena con nuestros técnicos UEFA y mejora tu juego.',  39.99, 399.99, '/img/futbol.jpg'),
  ('Tenis',       'Clases individuales y grupales para todos los niveles.',  44.99, 449.99, '/img/tenis.jpg'),
  ('Baloncesto',  'Técnica, táctica y juego colectivo con profesionales.',   34.99, 349.99, '/img/baloncesto.jpg'),
  ('Voleibol',    'Aprende voleo, saque y remate con entrenadores expertos.',34.99, 349.99, '/img/voleibol.jpg');

-- ============================================================
-- FUNCIÓN: actualizar timestamp automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();