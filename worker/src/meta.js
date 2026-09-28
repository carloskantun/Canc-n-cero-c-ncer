// API de Conversiones de Meta (server-side). Es opcional: si no hay
// META_PIXEL_ID y META_ACCESS_TOKEN configurados (wrangler secret), no se
// envía nada y el sitio sigue funcionando normal con solo el Pixel del navegador.
// Usa el mismo eventId que manda el navegador para que Meta deduplique
// el evento del Pixel y el de esta API como uno solo.

async function sha256Hex(texto) {
  if (!texto) return undefined;
  const datos = new TextEncoder().encode(String(texto).trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enviarEventoLead(env, registro, request) {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) {
    console.log("[meta] CAPI no configurado; se omite el envío server-side.");
    return { enviado: false, motivo: "sin_configurar" };
  }
  try {
    const userData = {
      em: [await sha256Hex(registro.email)],
      ph: registro.whatsapp ? [await sha256Hex("52" + registro.whatsapp)] : undefined,
      client_ip_address: request.headers.get("cf-connecting-ip") || undefined,
      client_user_agent: request.headers.get("user-agent") || undefined,
      fbp: registro.fbp || undefined,
      fbc: registro.fbc || undefined
    };
    const payload = {
      data: [{
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: registro.eventId || undefined,
        action_source: "website",
        event_source_url: registro.pagina || env.SITE_URL,
        user_data: userData,
        custom_data: {
          content_name: "Registro taller",
          utm_source: registro.utm_source || undefined,
          utm_campaign: registro.utm_campaign || undefined
        }
      }]
    };
    const resp = await fetch(
      `https://graph.facebook.com/v20.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_ACCESS_TOKEN)}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (!resp.ok) {
      console.error("[meta] CAPI respondió con error:", resp.status, await resp.text().catch(() => ""));
      return { enviado: false, motivo: "error_meta" };
    }
    return { enviado: true };
  } catch (err) {
    console.error("[meta] Error enviando evento:", err);
    return { enviado: false, motivo: "excepcion" };
  }
}
