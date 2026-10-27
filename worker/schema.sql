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

-- Proyección de registros para campañas. No cambia tablas ni IDs existentes.
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY REFERENCES registros(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  origen TEXT NOT NULL CHECK (origen IN ('fb', 'ig', 'organico')),
  created_at TEXT NOT NULL,
  evento_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

CREATE TRIGGER IF NOT EXISTS registros_leads_insert
AFTER INSERT ON registros
BEGIN
  INSERT INTO leads (id,nombre,whatsapp,email,origen,created_at,evento_id)
  VALUES (NEW.id,NEW.nombre,NEW.whatsapp,NEW.email,CASE WHEN lower(trim(COALESCE(NEW.utm_source, ''))) IN ('fb','facebook','facebook.com','m.facebook.com','l.facebook.com') THEN 'fb' WHEN lower(trim(COALESCE(NEW.utm_source, ''))) IN ('ig','instagram','instagram.com','l.instagram.com') THEN 'ig' ELSE 'organico' END,NEW.creado_en,NEW.event_id)
  ON CONFLICT(id) DO UPDATE SET nombre=excluded.nombre,whatsapp=excluded.whatsapp,
    email=excluded.email,origen=excluded.origen,created_at=excluded.created_at,evento_id=excluded.evento_id;
END;

CREATE TRIGGER IF NOT EXISTS registros_leads_update
AFTER UPDATE OF nombre,whatsapp,email,utm_source,creado_en,event_id ON registros
BEGIN
  INSERT INTO leads (id,nombre,whatsapp,email,origen,created_at,evento_id)
  VALUES (NEW.id,NEW.nombre,NEW.whatsapp,NEW.email,CASE WHEN lower(trim(COALESCE(NEW.utm_source, ''))) IN ('fb','facebook','facebook.com','m.facebook.com','l.facebook.com') THEN 'fb' WHEN lower(trim(COALESCE(NEW.utm_source, ''))) IN ('ig','instagram','instagram.com','l.instagram.com') THEN 'ig' ELSE 'organico' END,NEW.creado_en,NEW.event_id)
  ON CONFLICT(id) DO UPDATE SET nombre=excluded.nombre,whatsapp=excluded.whatsapp,
    email=excluded.email,origen=excluded.origen,created_at=excluded.created_at,evento_id=excluded.evento_id;
END;

-- Incorporar registros anteriores sin duplicarlos ni enviar eventos históricos a Meta.
INSERT OR IGNORE INTO leads (id,nombre,whatsapp,email,origen,created_at,evento_id)
SELECT id,nombre,whatsapp,email,CASE WHEN lower(trim(COALESCE(utm_source, ''))) IN ('fb','facebook','facebook.com','m.facebook.com','l.facebook.com') THEN 'fb' WHEN lower(trim(COALESCE(utm_source, ''))) IN ('ig','instagram','instagram.com','l.instagram.com') THEN 'ig' ELSE 'organico' END,creado_en,event_id FROM registros;

-- Ampliación aditiva: no modifica ni elimina registros ni la biblioteca.
CREATE TABLE IF NOT EXISTS sesiones (
 id TEXT PRIMARY KEY,
 inicio TEXT NOT NULL,
 fin TEXT NOT NULL,
 lugar TEXT NOT NULL,
 cupo INTEGER NOT NULL CHECK(cupo >= 0),
 activa INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0,1))
);
CREATE TABLE IF NOT EXISTS tickets (
 id TEXT PRIMARY KEY,
 registro_id INTEGER NOT NULL REFERENCES registros(id),
 sesion_id TEXT NOT NULL REFERENCES sesiones(id),
 asiento INTEGER NOT NULL CHECK(asiento BETWEEN 1 AND 25),
 estado TEXT NOT NULL DEFAULT 'confirmado' CHECK(estado IN ('confirmado','cancelado')),
 creado_en TEXT NOT NULL DEFAULT (datetime('now')),
 cancelado_en TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_persona_activo ON tickets(registro_id) WHERE estado='confirmado';
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_asiento_activo ON tickets(sesion_id,asiento) WHERE estado='confirmado';
CREATE INDEX IF NOT EXISTS idx_tickets_sesion ON tickets(sesion_id,estado);
-- La comprobación y la escritura se ejecutan juntas en SQLite.
CREATE TRIGGER IF NOT EXISTS tickets_validar_cupo
BEFORE INSERT ON tickets WHEN NEW.estado='confirmado'
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM sesiones s WHERE s.id=NEW.sesion_id AND s.activa=1
  AND julianday(s.inicio)>julianday('now')
  AND (SELECT COUNT(*) FROM tickets t WHERE t.sesion_id=s.id AND t.estado='confirmado')<s.cupo
 ) THEN RAISE(ABORT,'SESION_NO_DISPONIBLE') END;
END;
-- No se permite trasladar ni reactivar un ticket: cancelar y emitir uno nuevo.
CREATE TRIGGER IF NOT EXISTS tickets_inmutables
BEFORE UPDATE ON tickets WHEN NEW.id<>OLD.id OR NEW.registro_id<>OLD.registro_id
 OR NEW.asiento<>OLD.asiento OR NEW.sesion_id<>OLD.sesion_id OR (OLD.estado='cancelado' AND NEW.estado<>'cancelado')
BEGIN SELECT RAISE(ABORT,'TICKET_INMUTABLE'); END;
INSERT OR IGNORE INTO sesiones(id,inicio,fin,lugar,cupo) VALUES
('nov16-manana','2026-11-16T11:30:00-05:00','2026-11-16T13:00:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov16-tarde','2026-11-16T18:00:00-05:00','2026-11-16T19:30:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov17-manana','2026-11-17T11:30:00-05:00','2026-11-17T13:00:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov17-tarde','2026-11-17T18:00:00-05:00','2026-11-17T19:30:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov18-manana','2026-11-18T11:30:00-05:00','2026-11-18T13:00:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov18-tarde','2026-11-18T18:00:00-05:00','2026-11-18T19:30:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov21-manana','2026-11-21T11:30:00-05:00','2026-11-21T13:00:00-05:00','Hospital Galenia Cancún · Auditorio',25),
('nov21-tarde','2026-11-21T18:00:00-05:00','2026-11-21T19:30:00-05:00','Hospital Galenia Cancún · Auditorio',25);
-- Registro persistente del envío del ticket; no cambia registros existentes.
CREATE TABLE IF NOT EXISTS tickets_correos (
 ticket_id TEXT PRIMARY KEY REFERENCES tickets(id),
 enviado_en TEXT,
 intentos INTEGER NOT NULL DEFAULT 0,
 ultimo_error TEXT
);
-- Sustituye el bloqueo por día por un bloqueo de la sesión cancelada.
DROP TRIGGER IF EXISTS tickets_fecha_cancelada;
CREATE TRIGGER IF NOT EXISTS tickets_sesion_cancelada
BEFORE INSERT ON tickets WHEN NEW.estado='confirmado'
BEGIN
 SELECT CASE WHEN EXISTS (
  SELECT 1 FROM tickets t WHERE t.registro_id=NEW.registro_id
  AND t.estado='cancelado' AND t.sesion_id=NEW.sesion_id
 ) THEN RAISE(ABORT,'SESION_CANCELADA') END;
END;
