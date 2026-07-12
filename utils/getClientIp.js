// Resolves the real client IP for rate limiting and the profile rules
// engine. Preference order:
//   1. CF-Connecting-IP — authoritative when the origin sits behind
//      Cloudflare (this deployment: Cloudflare -> homelab origin).
//   2. First X-Forwarded-For hop — generic reverse-proxy fallback.
//   3. The socket address — direct connections (dev/tests).
// Trust assumption: the origin is only reachable through the proxy that
// sets these headers (api.js sets 'trust proxy' to 1 to match). If the
// origin ever becomes directly internet-reachable these headers are
// client-forgeable and this helper must be revisited.
const getClientIp = (req) => {
  const cfIp = req.header('CF-Connecting-IP');
  if (cfIp) {
    return cfIp.trim();
  }

  const forwarded = req.header('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || 'unknown';
};

module.exports = getClientIp;
