export function isFoundationDynamicsLocation(
  pathname = window.location.pathname,
  search = window.location.search,
): boolean {
  return (
    pathname === "/foundation/dynamics" ||
    pathname === "/foundation/dynamics.html" ||
    search.includes("foundation-dynamics")
  );
}

export function isFoundationLocation(
  pathname = window.location.pathname,
  search = window.location.search,
): boolean {
  if (isFoundationDynamicsLocation(pathname, search)) {
    return false;
  }
  return (
    pathname === "/foundation" ||
    pathname === "/foundation.html" ||
    search.includes("foundation")
  );
}
