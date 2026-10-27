// Meta Pixel (1671048727876935) — rota sem banner: o pixel só carrega fora das
// regiões que exigem consentimento; em região desconhecida ele também fica bloqueado.

export const PIXEL_ID = "1671048727876935";

const CONSENT_REGIONS = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
]);

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function dispatch(args: unknown[]) {
  const fbq = window.fbq;
  if (!fbq) return;
  if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
  else fbq.queue.push(args);
}

async function visitorRegion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    const res = await fetch("/cdn-cgi/trace", { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    return text.match(/^loc=(.+)$/m)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

let ready = false;

export async function initMetaPixel(): Promise<void> {
  if (window.fbq || ready) return;
  const region = await visitorRegion();
  if (!region || region === "XX" || region === "T1" || CONSENT_REGIONS.has(region)) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  } as Fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  dispatch(["init", PIXEL_ID, {}, { agent: "renovac" }]);
  ready = true;
  trackPageView();
}

export function trackPageView(): void {
  if (!ready) return;
  dispatch(["track", "PageView"]);
}
