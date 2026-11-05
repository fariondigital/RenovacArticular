import { useState } from "react";

// Vídeo leve: até o lead tocar, mostra só a capa do YouTube (~60-100 KB) em vez do
// player completo (~1 MB de scripts). Ao tocar, o player carrega no mesmo lugar, dentro
// da página, já tocando — o lead não sai do funil.

export function youtubeId(src: string): string | null {
  const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?v=)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

// autoplay: começa ao abrir; playsinline: no iPhone toca dentro da página, sem tela cheia;
// rel=0: ao terminar, sugere só vídeos do próprio canal.
export function playerUrl(src: string): string {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");
  return url.toString();
}

const ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

export function VideoFacade({ src, title, className }: { src: string; title: string; className?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const id = youtubeId(src);

  if (open || !id) {
    return <iframe className={className} src={id ? playerUrl(src) : src} title={title} loading="lazy" allow={ALLOW} allowFullScreen />;
  }
  return (
    <button type="button" className={`${className ?? ""} yt-facade`} onClick={() => setOpen(true)} aria-label={`Assistir ao vídeo: ${title}`}>
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
      <span className="yt-play" aria-hidden="true" />
    </button>
  );
}
