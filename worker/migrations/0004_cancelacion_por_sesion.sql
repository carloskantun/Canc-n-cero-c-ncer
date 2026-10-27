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
