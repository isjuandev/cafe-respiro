/**
 * Configuración CAPTCHA/Turnstile.
 * Desactivado por defecto: no obliga al frontend a integrar proveedor externo.
 * Cuando se active (CAPTCHA_ENABLED=true), el guard exigirá header x-captcha-token
 * y lo verificará contra Cloudflare Turnstile (o hCaptcha si se cambia endpoint).
 *
 * Preparado para escalar sin cambiar la API: el frontend solo necesita enviar el token
 * cuando el backend lo requiera (se puede anunciar vía header X-Captcha-Required).
 */

export const captchaConfig = {
  enabled: process.env.CAPTCHA_ENABLED === 'true',
  // Si se activa, estas son requeridas
  provider: process.env.CAPTCHA_PROVIDER || 'turnstile', // turnstile | hcaptcha
  secretKey: process.env.CAPTCHA_SECRET_KEY || '',
  siteVerifyUrl: process.env.CAPTCHA_VERIFY_URL || 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  // Umbral: si rate limit se acerca al límite, se podría exigir captcha (futuro)
  // Por ahora solo ON/OFF global
};
