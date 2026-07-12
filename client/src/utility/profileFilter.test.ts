import { describe, it, expect } from 'vitest';
import { visibleInProfile } from './profileFilter';

describe('visibleInProfile', () => {
  it('shows everything when no profile is active', () => {
    expect(visibleInProfile({ profileIds: [2] }, null)).toBe(true);
    expect(visibleInProfile({ profileIds: [] }, null)).toBe(true);
  });

  it('unassigned items are visible in every profile', () => {
    expect(visibleInProfile({ profileIds: [] }, 5)).toBe(true);
    expect(visibleInProfile({}, 5)).toBe(true);
  });

  it('assigned items are visible only in their profiles', () => {
    expect(visibleInProfile({ profileIds: [5] }, 5)).toBe(true);
    expect(visibleInProfile({ profileIds: [1, 5] }, 5)).toBe(true);
    expect(visibleInProfile({ profileIds: [1, 2] }, 5)).toBe(false);
  });
});
