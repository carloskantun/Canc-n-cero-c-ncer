// Envío de correo con Resend (https://resend.com). Si no hay RESEND_API_KEY
// configurado (wrangler secret), simplemente no se envía y se avisa en el log,
// para que el sitio siga funcionando en desarrollo sin cuenta de correo.

export async function enviarCorreo(env, { para, asunto, html }) {
  if (!env.RESEND_API_KEY) {
    console.log("[correo] Proveedor no configurado; no se envía.");
    return { enviado: false, motivo: "sin_configurar" };
  }
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.CORREO_REMITENTE || "Cancún Cero Cáncer <hola@cancuncerocancer.com>",
      to: [para],
      subject: asunto,
      html
    })
  });
  if (!resp.ok) {
    console.error("[correo] Resend respondió con error:", resp.status);
    return { enviado: false, motivo: "error_proveedor" };
  }
  return { enviado: true };
}

function envoltorio(tituloVisible, cuerpoHtml, siteUrl) {
  return `<!doctype html><html lang="es-MX"><body style="margin:0;background:#f7f1e8;font-family:Arial,Helvetica,sans-serif;color:#1f2a2e;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-weight:800;font-size:18px;">Cancún <span style="color:#ef6f8e;">Cero</span> Cáncer</span>
    </div>
    <div style="background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 10px 30px rgba(31,42,46,.08);">
      ${cuerpoHtml}
    </div>
    <p style="text-align:center;color:#5b6b70;font-size:12px;margin-top:24px;">
      Recibiste este correo porque dejaste tus datos en ${siteUrl}. Contenido informativo, no sustituye la consulta médica.
    </p>
  </div>
  </body></html>`;
}

export function correoBienvenida({ nombre, enlaceBiblioteca, siteUrl }) {
  const primerNombre = escaparHtml(String(nombre || "").trim().split(/\s+/)[0] || "");
  return envoltorio(
    "Bienvenida",
    `<h1 style="font-size:22px;margin:0 0 12px;">¡Hola${primerNombre ? ", " + primerNombre : ""}!</h1>
     <p style="font-size:16px;line-height:1.5;">Gracias por registrarte en <strong>Cancún Cero Cáncer</strong>. Ya eres parte del movimiento de mujeres que están cuidando su salud con actividad física, buena alimentación y prevención.</p>
     <p style="font-size:16px;line-height:1.5;">Aquí está tu acceso permanente a la biblioteca de ejercicios y guías. Guarda este correo para volver cuando quieras.</p>
     <p style="text-align:center;margin:28px 0;">
       <a href="${enlaceBiblioteca}" style="background:#ef6f8e;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;display:inline-block;">Entrar a mi biblioteca</a>
     </p>
     <p style="font-size:13px;color:#5b6b70;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${enlaceBiblioteca}</p>`,
    siteUrl
  );
}

export function correoAcceso({ nombre, enlaceBiblioteca, siteUrl }) {
  const primerNombre = escaparHtml(String(nombre || "").trim().split(/\s+/)[0] || "");
  return envoltorio(
    "Tu acceso",
    `<h1 style="font-size:22px;margin:0 0 12px;">Aquí está tu acceso${primerNombre ? ", " + primerNombre : ""}</h1>
     <p style="font-size:16px;line-height:1.5;">Pediste entrar a la biblioteca de Cancún Cero Cáncer. Este enlace es personal, no lo compartas.</p>
     <p style="text-align:center;margin:28px 0;">
       <a href="${enlaceBiblioteca}" style="background:#0e9aa7;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;display:inline-block;">Entrar a mi biblioteca</a>
     </p>
     <p style="font-size:13px;color:#5b6b70;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${enlaceBiblioteca}</p>`,
    siteUrl
  );
}

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
