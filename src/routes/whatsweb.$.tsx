import { createFileRoute } from "@tanstack/react-router";

// Cobre /whatsweb/qualquer-coisa; o redirecionamento acontece na rota pai (whatsweb.tsx).
export const Route = createFileRoute("/whatsweb/$")({});
