import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const BARS = [10, 18, 26, 16, 30, 22, 12, 24, 28, 14, 20, 32, 18, 10, 26, 16, 22, 28, 12, 20, 24, 14, 30, 18, 10, 22, 26, 16];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, onPlay, onComplete }: { src?: string; onPlay?: () => void; onComplete?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrent(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onMeta = () => setDuration(audio.duration);
    const onAudioPlay = () => { setPlaying(true); onPlay?.(); };
    const onEnd = () => { setPlaying(false); onComplete?.(); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onAudioPlay);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onAudioPlay);
      audio.removeEventListener("ended", onEnd);
    };
  }, [onPlay, onComplete]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().catch(() => setPlaying(false));
    }
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
      <audio ref={audioRef} src={src} preload="metadata" className="wa-audio" />
    </div>
  );
}

