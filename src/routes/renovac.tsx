import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/renovac")({
  head: () => ({ meta: [
    { title: "Protocolo RenovArticular — Sabedoria do Corpo" },
    { name: "description", content: "Questionário do Protocolo RenovArticular." },
  ] }),
  component: Renovac,
});

function Renovac() {
  return <Funnel basePath="/renovac" />;
}
