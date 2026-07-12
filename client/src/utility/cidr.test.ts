import { describe, it, expect } from 'vitest';
import { ipMatchesCidr, ipMatchesAny } from './cidr';

describe('ipMatchesCidr', () => {
  it('matches inside an IPv4 /24', () => {
    expect(ipMatchesCidr('192.168.1.5', '192.168.1.0/24')).toBe(true);
    expect(ipMatchesCidr('192.168.2.5', '192.168.1.0/24')).toBe(false);
  });

  it('matches a bare address as /32', () => {
    expect(ipMatchesCidr('10.0.0.5', '10.0.0.5')).toBe(true);
    expect(ipMatchesCidr('10.0.0.6', '10.0.0.5')).toBe(false);
  });

  it('handles /8 and /16 boundaries', () => {
    expect(ipMatchesCidr('10.255.255.255', '10.0.0.0/8')).toBe(true);
    expect(ipMatchesCidr('11.0.0.1', '10.0.0.0/8')).toBe(false);
    expect(ipMatchesCidr('172.16.5.5', '172.16.0.0/16')).toBe(true);
    expect(ipMatchesCidr('172.17.5.5', '172.16.0.0/16')).toBe(false);
  });

  it('/0 matches everything, /32 is exact', () => {
    expect(ipMatchesCidr('8.8.8.8', '0.0.0.0/0')).toBe(true);
    expect(ipMatchesCidr('1.2.3.4', '1.2.3.4/32')).toBe(true);
    expect(ipMatchesCidr('1.2.3.5', '1.2.3.4/32')).toBe(false);
  });

  it('rejects malformed input rather than throwing', () => {
    expect(ipMatchesCidr('not.an.ip', '10.0.0.0/8')).toBe(false);
    expect(ipMatchesCidr('10.0.0.1', 'garbage')).toBe(false);
    expect(ipMatchesCidr('10.0.0.1', '10.0.0.0/40')).toBe(false);
    expect(ipMatchesCidr('999.0.0.1', '10.0.0.0/8')).toBe(false);
  });

  it('matches IPv6 only by exact string', () => {
    expect(ipMatchesCidr('::1', '::1')).toBe(true);
    expect(ipMatchesCidr('::1', '::2')).toBe(false);
  });
});

describe('ipMatchesAny', () => {
  it('returns true if any cidr matches', () => {
    expect(ipMatchesAny('192.168.1.5', ['10.0.0.0/8', '192.168.1.0/24'])).toBe(
      true
    );
  });

  it('returns false for a null ip (hints fetch failed)', () => {
    expect(ipMatchesAny(null, ['0.0.0.0/0'])).toBe(false);
  });
});
