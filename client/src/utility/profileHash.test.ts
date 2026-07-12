import { describe, it, expect } from 'vitest';
import { parseProfileHash } from './profileHash';

describe('parseProfileHash', () => {
  it('extracts and lowercases the profile name', () => {
    expect(parseProfileHash('#!/novastream')).toBe('novastream');
    expect(parseProfileHash('#!/HardReset')).toBe('hardreset');
    expect(parseProfileHash('#!/laptop-1_2')).toBe('laptop-1_2');
  });

  it('returns "" for the explicit clear form #!/', () => {
    expect(parseProfileHash('#!/')).toBe('');
  });

  it('returns null when there is no profile fragment', () => {
    expect(parseProfileHash('')).toBeNull();
    expect(parseProfileHash('#/settings')).toBeNull();
    expect(parseProfileHash('#anchor')).toBeNull();
    expect(parseProfileHash('#!/has spaces')).toBeNull();
    expect(parseProfileHash('#!/a/b')).toBeNull();
  });
});
