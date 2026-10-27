export const maleSuccessVideo = "https://www.youtube.com/embed/t1tRFlwYxB0";
export const femaleSuccessVideo = "https://www.youtube.com/embed/8nv-QpoVG6w";
const maleImages: Record<string, string> = {
  "2:n30": "/media/homem-sintomas.webp",
  "8:n41": "/media/homem-noticia.png",
  "27:n59": "/media/homem-antes.webp",
  "27:n65": "/media/homem-depois.webp",
};

export function funnelImage(step: number, node: string, gender: string | null, original: string | undefined) {
  if (step === 26 && node === "n27") return "/media/tabela-protocolo.webp";
  return (gender === "Homem" ? maleImages[`${step}:${node}`] : undefined) ?? original;
}

export function funnelVideo(step: number, node: string, gender: string | null, original: string) {
  if (step !== 27 || node !== "n384") return original;
  return gender === "Homem" ? maleSuccessVideo : femaleSuccessVideo;
}
