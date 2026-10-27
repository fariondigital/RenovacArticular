import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/oferta")({
  head: () => ({ meta: [
    { title: "Protocolo RenovArticular — Oferta | Dias Mais Felizes" },
    { name: "description", content: "Oferta do Protocolo RenovArticular, conteúdos, depoimentos e acesso." },
    { property: "og:title", content: "Protocolo RenovArticular — Oferta" },
    { property: "og:description", content: "Conteúdos, depoimentos e acesso ao protocolo — Dias Mais Felizes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Offer,
});

function Offer() { return <Funnel sales />; }