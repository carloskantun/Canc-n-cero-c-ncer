#!/usr/bin/env python3
"""Publica o revierte únicamente versiones estáticas de cancuncerocancer.com."""
import ctypes,datetime,os,pathlib,sys
if len(sys.argv)!=2:raise SystemExit('Uso: replace-static.py /home/cancuncerocancer/.ccc-release-ID')
root=pathlib.Path('/home/cancuncerocancer/public_html')
stage=pathlib.Path(sys.argv[1])
assert os.geteuid()==0
assert stage.parent==root.parent and stage.name.startswith('.ccc-release-')
assert stage.is_dir() and not stage.is_symlink()
assert root.is_dir() and not root.is_symlink()
assert (root/'index.html').is_file() and not (root/'wp-config.php').exists()
assert (stage/'index.html').is_file() and (stage/'.htaccess').is_file()
for p in stage.rglob('*'):
 assert not p.is_symlink(),p
 assert p.name not in {'.git','.env','.dev.vars','wp-config.php'},p
 assert p.suffix.lower() not in {'.php','.phtml','.phar','.cgi','.pl','.py','.sql'},p
backup=pathlib.Path('/root/ccc-clean-releases')
backup.mkdir(mode=0o700,exist_ok=True)
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
libc=ctypes.CDLL(None,use_errno=True)
f=libc.renameat2
f.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint]
f.restype=ctypes.c_int
if f(-100,os.fsencode(root),-100,os.fsencode(stage),2):raise OSError(ctypes.get_errno(),'Intercambio no realizado')
os.rename(stage,backup/('retired-'+stamp))
print('Publicada versión estática. Anterior:',backup/('retired-'+stamp))
