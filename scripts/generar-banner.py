# Genera public/banners/rebuscapp-1200x480.svg: banner animado de Rebuscapp
# para vadeprecio.com (1200 x 480). Uso: python scripts/generar-banner.py
import base64
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public') + '/'
logo=base64.b64encode(open(R+'logo-negro.png','rb').read()).decode()
lupa=base64.b64encode(open(R+'icono-negro.png','rb').read()).decode()

frases=['¿Necesitás a alguien?','¿Buscás trabajo?','Trabajo cerca tuyo.']
tarjetas=[('Plomería','Arreglar una canilla','$25.000'),('Limpieza','Casa, 4 horas','A convenir'),('Flete','Mudanza chica, hoy','$40.000')]

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="480" viewBox="0 0 1200 480">
<!-- Banner animado de Rebuscapp para vadeprecio.com (1200 x 480).
     Generado por un script: logo y lupa embebidos, animación en CSS
     (ciclo de 9 s). Funciona como <img>; el link lo pone el espacio del anuncio. -->
<defs>
  <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFCC2E"/><stop offset="0.5" stop-color="#FFBE0F"/><stop offset="1" stop-color="#FFAE00"/>
  </linearGradient>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#503C14" flood-opacity="0.22"/>
  </filter>
</defs>
<style>
  text {{ font-family: 'Poppins', 'Segoe UI', Helvetica, Arial, sans-serif; }}
  .frase {{ opacity: 0; animation: frase 9s infinite; }}
  .f1 {{ animation-delay: 0s; }} .f2 {{ animation-delay: 3s; }} .f3 {{ animation-delay: 6s; }}
  @keyframes frase {{
    0% {{ opacity: 0; transform: translateY(24px); }}
    5%, 30% {{ opacity: 1; transform: translateY(0); }}
    35%, 100% {{ opacity: 0; transform: translateY(-16px); }}
  }}
  .boton {{ transform-box: fill-box; transform-origin: center; animation: latido 1.8s ease-in-out infinite; }}
  @keyframes latido {{ 0%, 100% {{ transform: scale(1); }} 50% {{ transform: scale(1.04); }} }}
  .lupa {{ transform-box: fill-box; transform-origin: center; animation: lupa 2.4s ease-in-out infinite; }}
  @keyframes lupa {{ 0%, 100% {{ transform: rotate(-8deg) translateY(0); }} 50% {{ transform: rotate(8deg) translateY(-10px); }} }}
  .tarjeta {{ opacity: 0; animation: tarjeta 9s infinite; }}
  .t1 {{ animation-delay: 0.3s; }} .t2 {{ animation-delay: 0.7s; }} .t3 {{ animation-delay: 1.1s; }}
  @keyframes tarjeta {{
    0% {{ opacity: 0; transform: translateX(60px); }}
    6%, 88% {{ opacity: 1; transform: translateX(0); }}
    96%, 100% {{ opacity: 0; transform: translateX(0); }}
  }}
  @media (prefers-reduced-motion: reduce) {{
    .frase, .tarjeta, .boton, .lupa {{ animation: none; }}
    .f3, .tarjeta {{ opacity: 1; }}
  }}
</style>
<rect width="1200" height="480" fill="url(#fondo)"/>
<circle cx="1080" cy="-40" r="260" fill="#FFFFFF" opacity="0.18"/>
<circle cx="820" cy="560" r="200" fill="#FFFFFF" opacity="0.12"/>

<image href="data:image/png;base64,{logo}" xlink:href="data:image/png;base64,{logo}" x="70" y="56" width="290" height="88"/>
'''
for i,f in enumerate(frases,1):
    svg+=f'<text class="frase f{i}" x="70" y="250" font-size="62" font-weight="800" letter-spacing="-2" fill="#1C1C1E">{f}</text>\n'
svg+='''<text x="72" y="300" font-size="26" font-weight="500" fill="#1C1C1E" fill-opacity="0.75">En Comodoro. Gratis y sin comisiones.</text>
<g class="boton">
  <rect x="70" y="345" width="410" height="72" rx="36" fill="#1C1C1E"/>
  <text x="275" y="390" font-size="27" font-weight="700" fill="#FFFFFF" text-anchor="middle">Entrá gratis <tspan fill="#FFC21A">→</tspan> rebuscapp.com</text>
</g>
'''
for i,(rubro,desc,precio) in enumerate(tarjetas,1):
    y=110+(i-1)*112
    svg+=f'''<g class="tarjeta t{i}" filter="url(#sombra)">
  <rect x="790" y="{y}" width="350" height="92" rx="22" fill="#FFFFFF"/>
  <rect x="812" y="{y+20}" width="{len(rubro)*12+32}" height="30" rx="15" fill="#FFF1C2"/>
  <text x="828" y="{y+41}" font-size="16" font-weight="600" fill="#8A6100">{rubro}</text>
  <text x="814" y="{y+74}" font-size="19" font-weight="500" fill="#1C1C1E">{desc}</text>
  <text x="1118" y="{y+41}" font-size="20" font-weight="700" fill="#1F6FEB" text-anchor="end">{precio}</text>
</g>
'''
svg+=f'''<g class="lupa">
  <circle cx="610" cy="112" r="50" fill="#1C1C1E"/>
  <circle cx="610" cy="112" r="43" fill="#FFC21A"/>
  <image href="data:image/png;base64,{lupa}" xlink:href="data:image/png;base64,{lupa}" x="594" y="87" width="32" height="50"/>
</g>
</svg>
'''
open(R+'banners/rebuscapp-1200x480.svg','w',encoding='utf-8').write(svg)
print(len(svg))
