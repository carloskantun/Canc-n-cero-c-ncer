#!/usr/bin/env python3
"""Compone la vista previa social, sin texto generado por IA."""
from pathlib import Path
import sys
from PIL import Image,ImageOps,ImageDraw,ImageFont
base=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Uso: compose-og.py DIRECTORIO_FUENTES (ccc-montserrat.ttf, ccc-nunito.ttf)')
fonts=Path(sys.argv[1])
im=ImageOps.fit(Image.open(base/'public/assets/img/hero-principal-desktop.webp').convert('RGBA'),(1200,630))
overlay=Image.new('RGBA',im.size)
d=ImageDraw.Draw(overlay)
for x in range(1200):d.line([(x,0),(x,629)],fill=(14,154,167,int(255*.7*(1-x/1600))))
im=Image.alpha_composite(im,overlay);d=ImageDraw.Draw(im)
f=ImageFont.truetype(str(fonts/'ccc-montserrat.ttf'),76);f.set_variation_by_axes([800])
g=ImageFont.truetype(str(fonts/'ccc-nunito.ttf'),36);g.set_variation_by_axes([600])
d.text((66,170),'Cancún',font=f,fill='white',stroke_width=0)
d.text((66,266),'Cero Cáncer',font=f,fill='white')
d.text((70,394),'Muévete hoy, cuídate siempre',font=g,fill='white')
im.convert('RGB').save(base/'public/assets/img/og-image.jpg',quality=86,optimize=True)
assert (base/'public/assets/img/og-image.jpg').stat().st_size<300000
print('OG: 1200×630,', (base/'public/assets/img/og-image.jpg').stat().st_size,'bytes')
