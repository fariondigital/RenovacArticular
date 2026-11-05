import content from "@/lib/funnel-content.json";
import { funnelImage } from "@/lib/funnel-media";
import { sourceAssets } from "@/lib/source-assets";

// Pré-carregamento: enquanto o lead lê uma tela, o navegador baixa em segundo plano as
// imagens da tela seguinte. Quando ele clica em avançar, a imagem já está pronta.
// Só a próxima tela — não o funil inteiro —, para não gastar dados de quem sai no meio.

const IMG_TAG = /<img\b[^>]*>/g;
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

// Imagens (já com a troca por gênero) que a tela `step` vai mostrar. Sem gênero definido
// (a escolha é feita na tela 1), inclui as duas versões.
export function stepImageUrls(step: number, gender: string | null): string[] {
  const html = content[step]?.html;
  if (!html) return [];
  const urls = new Set<string>();
  for (const [tag] of html.matchAll(IMG_TAG)) {
    const original = sourceAssets[attr(tag, "src") ?? ""];
    const node = attr(tag, "data-clone-node") ?? "";
    for (const g of gender ? [gender] : ["Mulher", "Homem"]) {
      const url = funnelImage(step, node, g, original);
      if (url) urls.add(url);
    }
  }
  return [...urls];
}

const requested = new Set<string>();

export function prefetchImages(urls: string[]): void {
  for (const url of urls) {
    if (requested.has(url)) continue;
    requested.add(url);
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low"; // não disputa banda com o que está na tela
    img.src = url;
  }
}
