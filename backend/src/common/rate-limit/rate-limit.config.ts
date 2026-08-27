/**
 * Configuración centralizada para rate limiting de votos.
 * Límites elegidos para equilibrar protección anti-bot y NAT legítimo.
 *
 * - IP: generoso (NAT con 10-20 usuarios). Un usuario legítimo vota 1-3 veces por sesión.
 *   Atacante con IP única queda bloqueado rápido; botnet con IPs rotadas queda limitado por contacto.
 * - Contacto: estricto (identidad del votante). Un contacto real no vota >5 veces/min.
 *
 * Todas son ventanas fijas con reset. Se pueden ajustar vía env sin redeploy.
 */

export const rateLimitConfig = {
  // Límite por IP (capa 1)
  ip: {
    // Ventana corta: anti-burst (scripts que mandan 100 req en 10s)
    burst: {
      windowMs: parseInt(process.env.VOTE_RATE_IP_BURST_WINDOW_MS || '10000', 10), // 10s
      max: parseInt(process.env.VOTE_RATE_IP_BURST_MAX || '20', 10), // 20 votos /10s por IP (permite 20 usuarios NAT en ráfaga)
    },
    // Ventana principal: uso normal
    windowMs: parseInt(process.env.VOTE_RATE_IP_WINDOW_MS || '60000', 10), // 1 min
    max: parseInt(process.env.VOTE_RATE_IP_MAX || '20', 10), // 20 votos /min por IP (NAT: ~20 usuarios)
    // Ventana larga opcional para abuso sostenido (desactivada si max=0)
    hourWindowMs: parseInt(process.env.VOTE_RATE_IP_HOUR_WINDOW_MS || '3600000', 10),
    hourMax: parseInt(process.env.VOTE_RATE_IP_HOUR_MAX || '60', 10), // 60 votos /hora por IP
  },

  // Límite por contacto normalizado (capa 2)
  contacto: {
    windowMs: parseInt(process.env.VOTE_RATE_CONTACT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.VOTE_RATE_CONTACT_MAX || '5', 10), // 5 votos /min por contacto
    hourWindowMs: parseInt(process.env.VOTE_RATE_CONTACT_HOUR_WINDOW_MS || '3600000', 10),
    hourMax: parseInt(process.env.VOTE_RATE_CONTACT_HOUR_MAX || '20', 10), // 20 votos /hora por contacto
  },

  // Mensajes para 429
  message: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
};
