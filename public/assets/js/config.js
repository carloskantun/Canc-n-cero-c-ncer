/* Configuración técnica del sitio (la edita quien despliega, no quien edita textos).
   - apiBase: dónde vive el Worker de Cloudflare.
       "/api"                                → si el dominio pasa por Cloudflare y el Worker tiene la ruta cancuncerocancer.com/api/*
       "https://api.cancuncerocancer.com/api" → si el Worker vive en un subdominio
   - El Pixel se configura en content/sitio.json → meta.pixel_id.
*/
window.CCC_CONFIG = {
  apiBase: "https://cancuncerocancer-api.carloskantun.workers.dev/api",
  correoHabilitado: false,
  contenido: "/content/sitio.json"
};
