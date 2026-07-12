// Parses the profile URL fragment (https://host/#!/name). BrowserRouter
// ignores hash fragments entirely, so this scheme cannot collide with
// routing. Returns:
//   null - no profile fragment present (plain '/', '#foo', etc.)
//   ''   - explicit clear: '#!/' (forget the remembered profile)
//   name - lowercase profile name from '#!/name'
export const parseProfileHash = (
  hash: string = window.location.hash
): string | null => {
  const match = hash.match(/^#!\/([A-Za-z0-9_-]*)$/);

  return match === null ? null : match[1].toLowerCase();
};
