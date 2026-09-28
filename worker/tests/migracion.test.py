"""Verifica migración aditiva, atribución y sincronización sin tocar producción."""
from pathlib import Path
import sqlite3
base = Path(__file__).resolve().parents[1]
schema = (base / 'schema.sql').read_text()
migration = (base / 'migrations/0001_leads.sql').read_text()
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript(schema.split('-- Proyección de registros')[0])
def insertar(email, source):
    db.execute("INSERT INTO registros(nombre,email,whatsapp,token,token_creado,utm_source,event_id) VALUES(?,?,?,?,?,?,?)", ('Prueba',email,'9981234567',email,'2026-09-28',source,email))
insertar('anterior@example.invalid','Instagram')
db.executescript(migration)
assert db.execute('SELECT origen FROM leads').fetchone()[0] == 'ig'
for source,expected in [('fb','fb'),('facebook','fb'),('ig','ig'),('', 'organico'),('google','organico')]:
    email=source+'@example.invalid'
    insertar(email, source)
    assert db.execute('SELECT origen FROM leads WHERE email=?',(email,)).fetchone()[0] == expected
count=db.execute('SELECT count(*) FROM leads').fetchone()[0]
db.executescript(migration)
assert db.execute('SELECT count(*) FROM leads').fetchone()[0] == count
assert db.execute('SELECT count(*) FROM registros').fetchone()[0] == count
db.execute("UPDATE registros SET nombre='Nuevo',utm_source='fb' WHERE email='anterior@example.invalid'")
assert db.execute("SELECT nombre,origen FROM leads WHERE email='anterior@example.invalid'").fetchone() == ('Nuevo','fb')
db.execute("DELETE FROM registros WHERE email='anterior@example.invalid'")
assert db.execute("SELECT count(*) FROM leads WHERE email='anterior@example.invalid'").fetchone()[0] == 0
assert db.execute('PRAGMA foreign_key_check').fetchall() == []
print('Migración verificada: datos anteriores, fb/ig/orgánico, reejecución, actualización y borrado.')
