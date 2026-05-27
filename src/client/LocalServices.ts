const LOCAL_SERVICE_OVERRIDE_KEY = "openfront.localServices";

export function isLocalhost(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function hasExplicitApiHost(): boolean {
  return Boolean(process?.env?.API_DOMAIN || localStorage.getItem("apiHost"));
}

export function areLocalServicesEnabled(): boolean {
  if (!isLocalhost()) return true;
  if (hasExplicitApiHost()) return true;
  return localStorage.getItem(LOCAL_SERVICE_OVERRIDE_KEY) === "true";
}

export function shouldUseBundledServiceFallbacks(): boolean {
  return !areLocalServicesEnabled();
}
