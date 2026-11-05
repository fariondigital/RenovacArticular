import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Pause, Play } from "lucide-react";

const BARS = [10, 18, 26, 16, 30, 22, 12, 24, 28, 14, 20, 32, 18, 10, 26, 16, 22, 28, 12, 20, 24, 14, 30, 18, 10, 22, 26, 16];

// Velocidades como no WhatsApp: cada toque passa para a próxima.
export const RATES = [1, 1.5, 2] as const;
const RATE_KEY = "renovarticular-audio-rate";
const KEY_STEP = 5; // segundos por toque nas setas do teclado

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function savedRate(): number {
  try {
    const value = Number(window.sessionStorage.getItem(RATE_KEY));
    return (RATES as readonly number[]).includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

export function AudioPlayer({ src, onPlay, onComplete }: { src?: string; onPlay?: () => void; onComplete?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(1);
  const [dragging, setDragging] = useState(false);
  // Busca de trecho: o servidor (Cloudflare) sempre entrega o arquivo inteiro e não aceita
  // pedidos parciais, então o navegador não consegue pular para um trecho ainda não baixado.
  // Na primeira vez que o lead arrasta, baixamos o áudio completo uma vez e passamos a tocar
  // a cópia local, onde qualquer trecho fica disponível. Quem só aperta play não baixa nada a mais.
  const fullRef = useRef<{ url?: string; loading?: Promise<void> | undefined; target?: number | undefined; swapping?: boolean }>({});

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (fullRef.current.swapping || fullRef.current.target !== undefined) return;
      setCurrent(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onMeta = () => setDuration(audio.duration);
    const onAudioPlay = () => { setPlaying(true); if (!fullRef.current.swapping) onPlay?.(); };
    const onPause = () => { if (!fullRef.current.swapping) setPlaying(false); };
    const onEnd = () => { setPlaying(false); onComplete?.(); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onAudioPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onAudioPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, [onPlay, onComplete]);

  useEffect(() => () => { if (fullRef.current.url) URL.revokeObjectURL(fullRef.current.url); }, []);

  // A velocidade escolhida vale para os próximos áudios do funil (mesma aba).
  useEffect(() => setRate(savedRate()), []);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.defaultPlaybackRate = rate; // mantém a velocidade se o áudio recarregar
    audio.playbackRate = rate;
  }, [rate]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // Navegadores antigos não devolvem Promise em play().
      void Promise.resolve(audio.play()).catch(() => setPlaying(false));
    }
  };

  const cycleRate = () => {
    const nextRate = RATES[(RATES.indexOf(rate as (typeof RATES)[number]) + 1) % RATES.length]!;
    setRate(nextRate);
    try { window.sessionStorage.setItem(RATE_KEY, String(nextRate)); } catch { /* aba anônima: só não lembra */ }
  };

  const loadFull = (audio: HTMLAudioElement) => {
    const full = fullRef.current;
    if (full.loading || !src) return;
    const wasPlaying = () => !audio.paused;
    full.loading = fetch(src)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((blob) => new Promise<void>((resolve) => {
        const resume = wasPlaying();
        full.url = URL.createObjectURL(blob);
        full.swapping = true;
        audio.addEventListener("loadedmetadata", () => {
          audio.currentTime = full.target ?? 0;
          full.target = undefined;
          const done = () => { full.swapping = false; resolve(); };
          if (resume) void Promise.resolve(audio.play()).then(done, () => { done(); setPlaying(false); });
          else done();
        }, { once: true });
        audio.src = full.url;
      }))
      .catch(() => {
        // Sem conexão para baixar: tenta pular direto (funciona no trecho já baixado).
        if (full.target !== undefined) audio.currentTime = full.target;
        full.target = undefined;
        full.swapping = false;
        full.loading = undefined;
      });
  };

  const seekTo = (ratio: number) => {
    const audio = audioRef.current;
    const total = audio?.duration;
    if (!audio || !total || !Number.isFinite(total)) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    const time = clamped * total;
    setProgress(clamped);
    setCurrent(time);
    const full = fullRef.current;
    if (full.url && !full.swapping) { audio.currentTime = time; return; }
    full.target = time; // aplicado assim que a cópia completa estiver pronta
    loadFull(audio);
  };

  // Arrastar (ou tocar) na onda leva o áudio para aquele trecho, como no WhatsApp.
  const seekFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0) seekTo((e.clientX - rect.left) / rect.width);
  };

  const total = duration || 0;
  const label = playing || current > 0 ? current : duration;

  return (
    <div className="wa-player">
      <button
        type="button"
        className="wa-play"
        onClick={toggle}
        aria-label={playing ? "Pausar áudio" : "Ouvir áudio"}
      >
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      <div className="wa-body">
        <div
          className={`wa-bars${dragging ? " dragging" : ""}`}
          role="slider"
          tabIndex={0}
          aria-label="Posição do áudio"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} de ${formatTime(total)}`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
            seekFromPointer(e);
          }}
          onPointerMove={(e) => { if (dragging) seekFromPointer(e); }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio || !total) return;
            const moves: Record<string, number> = { ArrowLeft: -KEY_STEP, ArrowDown: -KEY_STEP, ArrowRight: KEY_STEP, ArrowUp: KEY_STEP };
            const from = fullRef.current.target ?? audio.currentTime;
            if (e.key in moves) seekTo((from + moves[e.key]!) / total);
            else if (e.key === "Home") seekTo(0);
            else if (e.key === "End") seekTo(1);
            else return;
            e.preventDefault();
          }}
        >
          {BARS.map((height, i) => (
            <span key={i} style={{ height }} className={i / BARS.length < progress ? "on" : ""} />
          ))}
          <i className="wa-knob" style={{ left: `${progress * 100}%` }} aria-hidden="true" />
        </div>
        <div className="wa-meta">
          <span>{formatTime(label)}</span>
        </div>
      </div>
      <button type="button" className="wa-rate" onClick={cycleRate} aria-label={`Velocidade do áudio: ${rate}x. Toque para mudar`}>
        {String(rate).replace(".", ",")}x
      </button>
      <audio ref={audioRef} src={src} preload="metadata" className="wa-audio" />
    </div>
  );
}
