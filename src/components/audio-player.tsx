import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const BARS = [10, 18, 26, 16, 30, 22, 12, 24, 28, 14, 20, 32, 18, 10, 26, 16, 22, 28, 12, 20, 24, 14, 30, 18, 10, 22, 26, 16];

// Velocidades como no WhatsApp: cada toque passa para a próxima.
export const RATES = [1, 1.5, 2] as const;
const RATE_KEY = "renovarticular-audio-rate";
// "Áudio concluído" (pixel) só conta se o lead realmente ouviu a maior parte.
export const COMPLETE_SHARE = 0.8;

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
  // Segundos do áudio efetivamente ouvidos (cada segundo conta uma vez, mesmo se repetido).
  const heardRef = useRef<{ seconds: Set<number>; last: number; jumped: boolean }>({ seconds: new Set(), last: 0, jumped: false });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      const heard = heardRef.current;
      const now = audio.currentTime;
      // Pulos de trecho (ex.: controles da tela de bloqueio do celular) não contam como escuta.
      if (!heard.jumped && now > heard.last) {
        for (let sec = Math.floor(heard.last); sec < Math.ceil(now); sec++) heard.seconds.add(sec);
      }
      heard.last = now;
      heard.jumped = false;
      setCurrent(now);
      if (audio.duration) setProgress(now / audio.duration);
    };
    const onMeta = () => setDuration(audio.duration);
    const onAudioPlay = () => { setPlaying(true); onPlay?.(); };
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      const total = Math.ceil(audio.duration);
      if (total > 0 && heardRef.current.seconds.size >= total * COMPLETE_SHARE) onComplete?.();
    };
    const onSeeking = () => { heardRef.current.jumped = true; };
    const onSeeked = () => { heardRef.current.last = audio.currentTime; heardRef.current.jumped = false; };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onAudioPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeked);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onAudioPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeked);
    };
  }, [onPlay, onComplete]);

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
        <div className="wa-bars" aria-hidden="true">
          {BARS.map((height, i) => (
            <span key={i} style={{ height }} className={i / BARS.length < progress ? "on" : ""} />
          ))}
        </div>
        <div className="wa-meta">
          <span>{formatTime(playing || current > 0 ? current : duration)}</span>
        </div>
      </div>
      <button type="button" className="wa-rate" onClick={cycleRate} aria-label={`Velocidade do áudio: ${rate}x. Toque para mudar`}>
        {String(rate).replace(".", ",")}x
      </button>
      <audio ref={audioRef} src={src} preload="metadata" className="wa-audio" />
    </div>
  );
}
