import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// O antigo funil V2 (/whatsweb/) foi removido. Qualquer link antigo para ele
// (anúncio, WhatsApp, bio) redireciona para o funil principal na raiz,
// preservando UTMs/fbclid, para nenhum lead cair numa página de erro.
export const Route = createFileRoute("/whatsweb")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/${location.searchStr}`, statusCode: 301 });
  },
  component: Outlet,
});
