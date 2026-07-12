// Minimal IP matcher for profile rules. Supports IPv4 CIDR ('10.0.0.0/8'),
// bare IPv4 ('192.168.1.5', treated as /32), and exact IPv6 string match.
// No dependency — the rule set is tiny and only ever tested against the
// single server-reported client IP.

const ipv4ToInt = (ip: string): number | null => {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    value = value * 256 + octet;
  }
  // >>> 0 keeps it an unsigned 32-bit int
  return value >>> 0;
};

// Does `ip` fall inside the single `cidr` (or match a bare address)?
export const ipMatchesCidr = (ip: string, cidr: string): boolean => {
  const trimmed = cidr.trim();
  if (!trimmed) return false;

  // IPv6 (or anything with a colon): exact match only
  if (trimmed.includes(':') || ip.includes(':')) {
    return trimmed.toLowerCase() === ip.trim().toLowerCase();
  }

  const [range, bitsRaw] = trimmed.split('/');
  const bits = bitsRaw === undefined ? 32 : Number(bitsRaw);

  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null) return false;

  if (bits === 0) return true;

  // mask for the top `bits` bits
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;

  return (ipInt & mask) === (rangeInt & mask);
};

// Does `ip` match ANY of the given CIDRs/addresses?
export const ipMatchesAny = (
  ip: string | null,
  cidrs: string[]
): boolean => {
  if (!ip) return false;
  return cidrs.some((cidr) => ipMatchesCidr(ip, cidr));
};
