export function isFoundationDynamicsLocation(
  pathname = window.location.pathname,
  search = window.location.search,
): boolean {
  const normalizedPathname = stripTrailingSlashes(pathname);
  return (
    normalizedPathname === "/foundation/dynamics" ||
    normalizedPathname === "/foundation/dynamics.html" ||
    search.includes("foundation-dynamics")
  );
}

export function isFoundationDynamicLocation(
  pathname = window.location.pathname,
  search = window.location.search,
): boolean {
  const normalizedPathname = stripTrailingSlashes(pathname);
  return (
    normalizedPathname === "/foundation/dynamic" ||
    normalizedPathname === "/foundation/dynamic.html" ||
    search.includes("foundation-dynamic")
  );
}

export function isFoundationLocation(
  pathname = window.location.pathname,
  search = window.location.search,
): boolean {
  if (
    isFoundationDynamicsLocation(pathname, search) ||
    isFoundationDynamicLocation(pathname, search)
  ) {
    return false;
  }
  const normalizedPathname = stripTrailingSlashes(pathname);
  return (
    normalizedPathname === "/foundation" ||
    normalizedPathname === "/foundation.html" ||
    search.includes("foundation")
  );
}

function stripTrailingSlashes(pathname: string): string {
  return pathname === "/" ? pathname : pathname.replace(/\/+$/u, "");
}
