// Profile visibility predicate for apps and categories.
//  - no active profile (base view) -> everything is visible
//  - empty/missing profileIds      -> item is visible in every profile
//  - otherwise                     -> visible only in its assigned profiles
export const visibleInProfile = (
  item: { profileIds?: number[] },
  activeProfileId: number | null
): boolean => {
  if (activeProfileId === null) {
    return true;
  }

  const ids = Array.isArray(item.profileIds) ? item.profileIds : [];

  return ids.length === 0 || ids.includes(activeProfileId);
};
