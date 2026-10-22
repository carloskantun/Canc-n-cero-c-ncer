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
