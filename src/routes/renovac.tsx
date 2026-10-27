import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/renovac")({
  head: () => ({ meta: [
    { title: "Protocolo RenovArticular — Sabedoria do Corpo" },
    { name: "description", content: "Questionário do Protocolo RenovArticular." },
  ] }),
  component: Outlet,
});
