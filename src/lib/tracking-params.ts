// Repassa parâmetros de campanha (UTMs, src, sck, fbclid…) da URL de entrada para o checkout.
const STORAGE_KEY = "renovarticular-tracking";
const ALLOWED = /^(utm_[a-z_]+|src|sck|xcod|fbclid|gclid|ttclid)$/i;

export function captureTrackingParams(search: string): void {
  const incoming = new URLSearchParams(search);
  const saved = readTrackingParams();
  let changed = false;
  incoming.forEach((value, key) => {
    if (ALLOWED.test(key) && value) { saved[key] = value; changed = true; }
  });
  if (changed) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function readTrackingParams(): Record<string, string> {
  try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export function withTrackingParams(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) if (k !== "pixelfb") url.searchParams.set(k, v);
  return url.toString();
}
