import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// V1 oficial fica na raiz do domínio (/, /oferta, /privacidade).
// Qualquer endereço em /renovac redireciona para o equivalente na raiz,
// preservando UTMs/parâmetros, para que todo o tráfego da V1 caia em uma única URL.
export const Route = createFileRoute("/renovac")({
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/^\/renovac/, "") || "/";
    const hash = location.hash ? `#${location.hash}` : "";
    throw redirect({ href: `${path}${location.searchStr}${hash}`, statusCode: 301 });
  },
  component: Outlet,
});
