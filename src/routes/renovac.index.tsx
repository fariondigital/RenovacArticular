import { createFileRoute } from "@tanstack/react-router";
import { Funnel } from "@/components/funnel";

export const Route = createFileRoute("/renovac/")({
  component: Renovac,
});

function Renovac() {
  return <Funnel basePath="/renovac" />;
}
