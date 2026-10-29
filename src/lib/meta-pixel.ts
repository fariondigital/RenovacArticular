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
const pendingQuizEvents: string[] = [];
const trackedQuizEvents = new Set<string>();
const QUIZ_EVENTS_SESSION_KEY = "renovarticular-quiz-v1-events";

function trackQuizEventOnce(key: string, eventName: string): void {
  let stored: string[] = [];
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(QUIZ_EVENTS_SESSION_KEY) || "[]");
    if (Array.isArray(parsed)) stored = parsed.filter((value): value is string => typeof value === "string");
  } catch {
    // Fall back to the in-memory set when session storage is unavailable.
  }

  if (stored.includes(key) || trackedQuizEvents.has(key)) return;
  trackedQuizEvents.add(key);
  try {
    window.sessionStorage.setItem(QUIZ_EVENTS_SESSION_KEY, JSON.stringify([...stored, key]));
  } catch {
    // The in-memory set still prevents repeats during this page session.
  }

  if (!ready) {
    pendingQuizEvents.push(eventName);
    return;
  }
  dispatch(["trackCustom", eventName]);
}

export function trackFunnelLandingViewed(): void {
  trackQuizEventOnce("landing-viewed", "FunnelLandingViewed");
}

export function trackQuizStarted(): void {
  trackQuizEventOnce("started", "QuizV1Started");
}

export function trackQuizStep(step: number): void {
  if (!Number.isInteger(step) || step < 1 || step > 27) return;
  trackQuizEventOnce(`step-${step}`, `QuizV1Step${String(step).padStart(2, "0")}Reached`);
}

export function trackQuizAudioStarted(step: number): void {
  if (!Number.isInteger(step) || step < 1 || step > 27) return;
  trackQuizEventOnce(`audio-started-${step}`, `QuizV1Step${String(step).padStart(2, "0")}AudioStarted`);
}

export function trackQuizAudioCompleted(step: number): void {
  if (!Number.isInteger(step) || step < 1 || step > 27) return;
  trackQuizEventOnce(`audio-completed-${step}`, `QuizV1Step${String(step).padStart(2, "0")}AudioCompleted`);
}

export function trackQuizVideoPageReached(step: number): void {
  if (!Number.isInteger(step) || step < 1 || step > 27) return;
  trackQuizEventOnce(`video-page-${step}`, `QuizV1Step${String(step).padStart(2, "0")}VideoPageReached`);
}

export function trackOfferPageReached(): void {
  trackQuizEventOnce("offer-page", "QuizV1OfferPageReached");
}

export function trackQuizCheckoutClick(): void {
  trackQuizEventOnce("checkout-click", "QuizV1CheckoutClick");
}

function flushPendingQuizEvents(): void {
  while (pendingQuizEvents.length > 0) {
    const eventName = pendingQuizEvents.shift();
    if (eventName) dispatch(["trackCustom", eventName]);
  }
}

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
  flushPendingQuizEvents();
}

export function trackPageView(): void {
  if (!ready) return;
  dispatch(["track", "PageView"]);
}
