/* Configuración técnica del sitio (la edita quien despliega, no quien edita textos).
   - apiBase: dónde vive el Worker de Cloudflare.
       "/api"                                → si el dominio pasa por Cloudflare y el Worker tiene la ruta cancuncerocancer.com/api/*
       "https://api.cancuncerocancer.com/api" → si el Worker vive en un subdominio
   - metaPixelId: ID del Pixel de Meta. Vacío = no se carga el Pixel.
*/
window.CCC_CONFIG = {
  apiBase: "/api",
  metaPixelId: "",
  contenido: "/content/sitio.json"
};
