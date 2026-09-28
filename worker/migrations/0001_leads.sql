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
