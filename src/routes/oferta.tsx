import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/oferta")({
  head: () => ({ meta: [
    { title: "Oferta | RenovacArticular - Protocolo que cura a dor dos brasileiros" },
    { name: "description", content: "Oferta do Protocolo RenovArticular, conteúdos, depoimentos e acesso." },
    { property: "og:title", content: "Protocolo RenovArticular — Oferta" },
    { property: "og:description", content: "Conteúdos, depoimentos e acesso ao protocolo — RenovacArticular - Protocolo que cura a dor dos brasileiros." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Offer,
});

function Offer() { return <Funnel sales />; }