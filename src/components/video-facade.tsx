import { useEffect, useRef, useState } from "react";

// Vídeo leve: até o lead tocar, mostra só a capa do YouTube (~60-100 KB) em vez do
// player completo (~1 MB de scripts). Ao tocar, o player carrega no mesmo lugar, dentro
// da página, já tocando — o lead não sai do funil.
//
// Enquanto o player carrega (alguns segundos em 4G fraco), a capa continua na tela com
// "Carregando vídeo…" por cima. Ela só sai quando o próprio YouTube avisa que o vídeo
// começou — assim o lead nunca vê o quadro preto e sabe que o toque funcionou.

const YT_ORIGIN = "https://www.youtube.com";

// Se o vídeo não começar sozinho (alguns iPhones bloqueiam), a capa sai depois que o
// player estiver pronto, para o lead tocar no play do YouTube.
const NO_AUTOPLAY_GRACE_MS = 2500;
// Se o YouTube não mandar nenhum aviso, a capa sai um pouco depois do player carregar.
const SILENT_PLAYER_GRACE_MS = 3000;
// Limite absoluto: nunca fica "carregando" para sempre (ex.: internet caiu).
const MAX_LOADING_MS = 12000;

export function youtubeId(src: string): string | null {
  const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?v=)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

// autoplay: começa ao abrir; playsinline: no iPhone toca dentro da página, sem tela cheia;
// rel=0: ao terminar, sugere só vídeos do próprio canal; enablejsapi + origin: o player
// avisa a página quando o vídeo começa (para tirar a capa na hora certa).
export function playerUrl(src: string, origin?: string): string {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("enablejsapi", "1");
  if (origin) url.searchParams.set("origin", origin);
  return url.toString();
}

// Abre a conexão com o YouTube assim que o dedo encosta na capa (antes de soltar),
// ganhando alguns décimos de segundo no carregamento do player.
let warmedUp = false;
function warmUp() {
  if (warmedUp) return;
  warmedUp = true;
  for (const href of [YT_ORIGIN, "https://www.google.com"]) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    document.head.append(link);
  }
}

type Stage = "cover" | "loading" | "playing";

// Estados do player do YouTube: -1 não iniciado, 0 terminou, 1 tocando, 2 pausado, 3 carregando, 5 pronto.
function playerState(data: unknown): number | undefined {
  let msg: unknown = data;
  if (typeof msg === "string") {
    try { msg = JSON.parse(msg); } catch { return undefined; }
  }
  if (!msg || typeof msg !== "object") return undefined;
  const { event, info } = msg as { event?: string; info?: unknown };
  if (event === "onStateChange" && typeof info === "number") return info;
  if (event === "infoDelivery" && info && typeof info === "object") {
    const state = (info as { playerState?: unknown }).playerState;
    if (typeof state === "number") return state;
  }
  if (event === "onReady") return 5;
  return undefined;
}

const ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

export function VideoFacade({ src, title, className }: { src: string; title: string; className?: string | undefined }) {
  const [stage, setStage] = useState<Stage>("cover");
  const [origin, setOrigin] = useState<string>();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const id = youtubeId(src);

  useEffect(() => {
    if (stage !== "loading") return;
    const frame = frameRef.current;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    const reveal = () => setStage("playing");
    let heard = false;
    let ready = false;
    let buffering = false;

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frame?.contentWindow) return;
      const state = playerState(e.data);
      if (state === undefined) return;
      heard = true;
      if (state === 1 || state === 0) { reveal(); return; } // tocando (ou já terminou)
      if (state === 3) buffering = true;
      if (!ready) {
        ready = true;
        // Pronto mas sem começar a carregar o vídeo: o navegador bloqueou o autoplay.
        later(() => { if (!buffering) reveal(); }, NO_AUTOPLAY_GRACE_MS);
      }
    };
    window.addEventListener("message", onMessage);

    // Pede ao player para avisar a página sobre o estado do vídeo (protocolo do YouTube).
    const subscribe = () => {
      const win = frame?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN);
      win.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"], id: 1, channel: "widget" }), YT_ORIGIN);
    };
    const onLoad = () => {
      subscribe();
      for (let i = 1; i <= 4; i++) later(() => { if (!heard) subscribe(); }, i * 250);
      later(() => { if (!heard) reveal(); }, SILENT_PLAYER_GRACE_MS);
    };
    frame?.addEventListener("load", onLoad);
    later(reveal, MAX_LOADING_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      frame?.removeEventListener("load", onLoad);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [stage]);

  if (!id) {
    return <iframe className={className} src={src} title={title} loading="lazy" allow={ALLOW} allowFullScreen />;
  }

  const loading = stage === "loading";
  return (
    <>
      {stage !== "cover" ? (
        <iframe ref={frameRef} className={className} src={playerUrl(src, origin)} title={title} allow={ALLOW} allowFullScreen />
      ) : null}
      {stage !== "playing" ? (
        <button
          type="button"
          className={`${className ?? ""} yt-facade${loading ? " yt-loading" : ""}`}
          onPointerDown={warmUp}
          onClick={() => {
            if (stage !== "cover") return;
            setOrigin(window.location.origin);
            setStage("loading");
          }}
          aria-label={loading ? "Carregando vídeo" : `Assistir ao vídeo: ${title}`}
          aria-busy={loading || undefined}
        >
          <img
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              // Quando não existe capa em alta, o YouTube devolve uma imagem cinza de 120 px.
              const img = e.currentTarget;
              if (img.naturalWidth <= 120 && !img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
          />
          {loading ? (
            <span className="yt-status" role="status">
              <span className="yt-spinner" aria-hidden="true" />
              Carregando vídeo…
            </span>
          ) : (
            <span className="yt-play" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </>
  );
}
