import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dias Mais Felizes — Protocolo Limpa Dor" },
    { name: "description", content: "Questionário do Protocolo RenovArticular — Dias Mais Felizes." },
    { property: "og:title", content: "Dias Mais Felizes — Protocolo Limpa Dor" },
    { property: "og:description", content: "Questionário do Protocolo RenovArticular — Dias Mais Felizes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <Funnel />;
}
