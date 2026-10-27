import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/renovac/oferta")({
  head: () => ({ meta: [
    { title: "Protocolo RenovArticular — Oferta | Sabedoria do Corpo" },
    { name: "description", content: "Oferta do Protocolo RenovArticular." },
  ] }),
  component: RenovacOffer,
});

function RenovacOffer() {
  return <Funnel sales basePath="/renovac" />;
}
