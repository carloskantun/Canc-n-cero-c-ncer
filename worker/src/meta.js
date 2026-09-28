// API de Conversiones de Meta (server-side). Es opcional: si no hay
// FB_PIXEL_ID y FB_CAPI_TOKEN configurados (admite los nombres META_* anteriores), no se
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
  const pixelId = env.FB_PIXEL_ID || env.META_PIXEL_ID;
  const accessToken = env.FB_CAPI_TOKEN || env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
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
        event_source_url: env.SITE_URL,
        user_data: userData,
        custom_data: {
          content_name: "Registro taller"
        }
      }]
    };
    if (env.FB_TEST_EVENT_CODE) payload.test_event_code = env.FB_TEST_EVENT_CODE;
    const version = env.FB_API_VERSION || "v22.0";
    const resp = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(pixelId)}/events`,
      { method: "POST", headers: { "content-type": "application/json", "authorization": `Bearer ${accessToken}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) {
      console.error("[meta] CAPI respondió con error:", resp.status);
      return { enviado: false, motivo: "error_meta" };
    }
    return { enviado: true };
  } catch (err) {
    console.error("[meta] Error enviando evento:", err.name);
    return { enviado: false, motivo: "excepcion" };
  }
}
