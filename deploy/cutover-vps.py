#!/usr/bin/env python3
"""Sustitución atómica del WordPress; no restaura contenido comprometido."""
import ctypes,os,pathlib,subprocess,datetime
root=pathlib.Path('/home/cancuncerocancer/public_html')
stage=pathlib.Path('/home/cancuncerocancer/.ccc-release-20260928')
backup=pathlib.Path('/root/ccc-backup-path').read_text().strip()
b=pathlib.Path(backup)
assert root.is_dir() and not root.is_symlink()
assert stage.is_dir() and (stage/'index.html').is_file() and (stage/'.htaccess').is_file()
assert (root/'wp-config.php').is_file()
assert (b/'verification.txt').is_file() and (b/'wordpress.sql.gz').is_file()
assert not (b/'wordpress-retired').exists()
assert all(not p.suffix.lower().startswith('.php') for p in stage.rglob('*') if p.is_file())
# Exportación final de datos, inmediatamente antes de retirar el sitio.
with (b/'wordpress-final.sql').open('wb') as f:
 subprocess.run(['mysqldump','--single-transaction','--routines','--triggers','--events','--hex-blob','--databases','cancunce_cero'],stdout=f,check=True)
subprocess.run(['gzip',str(b/'wordpress-final.sql')],check=True)
subprocess.run(['gzip','-t',str(b/'wordpress-final.sql.gz')],check=True)
libc=ctypes.CDLL(None,use_errno=True)
rename=libc.renameat2
rename.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint]
rename.restype=ctypes.c_int
if rename(-100,os.fsencode(root),-100,os.fsencode(stage),2):
 raise OSError(ctypes.get_errno(),'No se realizó el intercambio; sitio anterior intacto')
os.rename(stage,b/'wordpress-retired')
# Cerrar solo los procesos PHP de esta cuenta, ahora sin aplicación PHP pública.
subprocess.run(['pkill','-TERM','-u','cancuncerocancer','-x','lsphp'],check=False)
(b/'cutover.txt').write_text(datetime.datetime.now(datetime.timezone.utc).isoformat()+'\nRetirada atómica; base MySQL conservada, sin uso en la web nueva.\n')
subprocess.run(['tar','-czf','/root/ccc-first-clean-release-20260928.tar.gz','-C',str(root),'.'],check=True)
print('CORTE COMPLETADO. WordPress aislado en',b/'wordpress-retired')
