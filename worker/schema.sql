-- Cancún Cero Cáncer — esquema D1
-- Aplicar con: wrangler d1 execute ccc_db --file=./schema.sql (agregar --remote en producción)

CREATE TABLE IF NOT EXISTS registros (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  edad          INTEGER,
  consentimiento INTEGER NOT NULL DEFAULT 0,

  token         TEXT NOT NULL UNIQUE,
  token_creado  TEXT NOT NULL,
  ultimo_acceso TEXT,

  -- Atribución de campaña, para saber qué anuncio trajo a cada persona
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  fbclid        TEXT,
  fbp           TEXT,
  fbc           TEXT,
  landing       TEXT,
  referrer      TEXT,

  event_id      TEXT,          -- para deduplicar Pixel vs. API de Conversiones
  ip            TEXT,
  user_agent    TEXT,

  taller        TEXT NOT NULL DEFAULT 'taller-1',
  creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registros_email ON registros (email);
CREATE INDEX IF NOT EXISTS idx_registros_token ON registros (token);
CREATE INDEX IF NOT EXISTS idx_registros_creado ON registros (creado_en);

-- Registro simple de qué correos se enviaron (acceso, recordatorios) para no duplicar envíos.
CREATE TABLE IF NOT EXISTS envios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  registro_id INTEGER NOT NULL REFERENCES registros(id),
  tipo        TEXT NOT NULL,   -- 'bienvenida' | 'acceso'
  enviado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);
