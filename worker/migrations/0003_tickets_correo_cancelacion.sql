-- Registro persistente del envío del ticket; no cambia registros existentes.
CREATE TABLE IF NOT EXISTS tickets_correos (
 ticket_id TEXT PRIMARY KEY REFERENCES tickets(id),
 enviado_en TEXT,
 intentos INTEGER NOT NULL DEFAULT 0,
 ultimo_error TEXT
);
-- Una cancelación libera el asiento, pero bloquea ese día a quien canceló.
CREATE TRIGGER IF NOT EXISTS tickets_fecha_cancelada
BEFORE INSERT ON tickets WHEN NEW.estado='confirmado'
BEGIN
 SELECT CASE WHEN EXISTS (
  SELECT 1 FROM tickets t JOIN sesiones anterior ON anterior.id=t.sesion_id
  JOIN sesiones nueva ON nueva.id=NEW.sesion_id
  WHERE t.registro_id=NEW.registro_id AND t.estado='cancelado'
  AND substr(anterior.inicio,1,10)=substr(nueva.inicio,1,10)
 ) THEN RAISE(ABORT,'FECHA_CANCELADA') END;
END;
