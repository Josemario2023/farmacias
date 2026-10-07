export const COOKIE_NOMBRE = "token";
export const INACTIVIDAD_MS = 10 * 60 * 1000;   // 10 min

// Atributos que identifican a la cookie. Deben ser idénticos al emitirla,
// renovarla y borrarla; si uno difiere, el navegador la trata como otra cookie.
export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,        // TODO producción: true cuando haya HTTPS (nginx/OCI)
  path: "/",
};

// Para emitir y renovar (lleva vigencia)
export const COOKIE_SESION = { ...COOKIE_BASE, maxAge: INACTIVIDAD_MS };