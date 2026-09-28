#!/usr/bin/env python3
"""Exporta la selección revisada y conserva las variantes fuera del despliegue."""
from pathlib import Path
import json,sys
from PIL import Image,ImageOps
base=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Uso: export-images.py DIRECTORIO_PNG_ORIGINALES')
source_dir=Path(sys.argv[1])
records=json.loads((base/'deploy/generated-images.json').read_text())
selected={'hero-principal-desktop':1,'hero-principal-mobile':1,'pilar-movimiento':1,'pilar-nutricion':2,'pilar-prevencion':2,'taller-grupo':2,'categoria-ligas':1,'categoria-botellas':2,'categoria-peso-corporal':2,'categoria-movilidad':2,'categoria-cardio':1,'nutricion-plato':2,'nutricion-hidratacion':3,'nutricion-revisiones':2,'registro-lateral':2,'biblioteca-hero':2}
assets=base/'public/assets/img';variants=assets/'_variantes';variants.mkdir(exist_ok=True)
for r in records:
 name,v=r['name'].rsplit('-v',1)
 size=(1280,720)
 if name.startswith('pilar-'):size=(1080,1080)
 elif name.startswith('nutricion-'):size=(1200,900)
 elif name=='taller-grupo':size=(1600,1067)
 elif name in ['registro-lateral','hero-principal-mobile']:size=(1080,1350)
 elif name=='hero-principal-desktop':size=(1920,1080)
 elif name=='biblioteca-hero':size=(1920,640)
 chosen=selected.get(name)==int(v)
 dest=assets/(name+'.webp') if chosen else variants/(r['name']+'.webp')
 ImageOps.fit(Image.open(source_dir/r['source']).convert('RGB'),size,method=Image.Resampling.LANCZOS).save(dest,quality=80,method=6)
 r.update(selected=chosen,output=str(dest.relative_to(base)),width=size[0],height=size[1])
(base/'deploy/generated-images.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print('Exportadas',len(records),'variantes;',sum(r['selected'] for r in records),'imágenes seleccionadas.')
