import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "RenovacArticular - Protocolo que cura a dor dos brasileiros" },
    { name: "description", content: "Questionário do Protocolo RenovArticular, o protocolo que cura a dor dos brasileiros." },
    { property: "og:title", content: "RenovacArticular - Protocolo que cura a dor dos brasileiros" },
    { property: "og:description", content: "Questionário do Protocolo RenovArticular, o protocolo que cura a dor dos brasileiros." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <Funnel />;
}
