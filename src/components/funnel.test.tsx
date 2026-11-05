import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Funnel, maleSuccessVideo, REQUIRED_ANSWER_MESSAGE } from "./funnel";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children?: React.ReactNode }) => <a {...props}>{children}</a>,
}));
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Original quiz interactions", () => {
  it("allows returning to the preceding question", () => {
    render(<Funnel />);
    fireEvent.click(screen.getByRole("button", { name: "QUERO APRENDER TAMBÉM !" }));
    fireEvent.click(screen.getByRole("button", { name: /Homem/ }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("button", { name: /Mulher/ })).toBeInTheDocument();
  });

  it("requires an answer before continuing a multiple-choice question", () => {
    render(<Funnel />);
    fireEvent.click(screen.getByRole("button", { name: "QUERO APRENDER TAMBÉM !" }));
    fireEvent.click(screen.getByRole("button", { name: /Mulher/ }));
    for (let i = 2; i < 7; i++) {
      const option = screen.getAllByRole("button").find((b) => b.textContent?.trim());
      if (!option) throw new Error(`Missing question ${i}`);
      fireEvent.click(option);
    }
    const next = screen.getByRole("button", { name: "Continuar" });
    // Sem nada marcado: botão claro (aria-disabled), sem aviso ainda.
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Tentar avançar sem marcar mostra o aviso e não sai da tela.
    fireEvent.click(next);
    expect(screen.getByRole("alert")).toHaveTextContent(REQUIRED_ANSWER_MESSAGE);
    expect(screen.getByRole("button", { name: "Artrose" })).toBeInTheDocument();
    // Marcar uma opção libera o botão e some com o aviso.
    fireEvent.click(screen.getByRole("button", { name: "Artrose" }));
    expect(next).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Artrite" }));
    expect(screen.getByRole("button", { name: "Artrose" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Artrite" })).toHaveAttribute("aria-pressed", "true");
    // Desmarcar tudo volta a bloquear.
    fireEvent.click(screen.getByRole("button", { name: "Artrose" }));
    fireEvent.click(screen.getByRole("button", { name: "Artrite" }));
    expect(next).toHaveAttribute("aria-disabled", "true");
    // Com opção marcada, avança para a próxima tela.
    fireEvent.click(screen.getByRole("button", { name: "Artrose" }));
    fireEvent.click(next);
    expect(screen.queryByRole("button", { name: "Artrose" })).not.toBeInTheDocument();
  });
});

describe("Male path success video", () => {
  it("persists the gender answer so the offer page can branch", () => {
    render(<Funnel />);
    fireEvent.click(screen.getByRole("button", { name: "QUERO APRENDER TAMBÉM !" }));
    fireEvent.click(screen.getByRole("button", { name: /Homem/ }));
    expect(sessionStorage.getItem("renovarticular-gender")).toBe("Homem");
  });

  it("swaps the success-page video for the male path", async () => {
    sessionStorage.setItem("renovarticular-gender", "Homem");
    render(<Funnel sales />);
    await waitFor(() => {
      expect(document.querySelector(".yt-facade img")?.getAttribute("src")).toBe("https://i.ytimg.com/vi/t1tRFlwYxB0/maxresdefault.jpg");
    });
    fireEvent.click(screen.getByRole("button", { name: /Assistir ao vídeo/ }));
    expect(document.querySelector("iframe")?.getAttribute("src")).toContain("https://www.youtube.com/embed/t1tRFlwYxB0?autoplay=1&playsinline=1&rel=0&enablejsapi=1");
  });

  it("keeps the default video on the female path", () => {
    sessionStorage.setItem("renovarticular-gender", "Mulher");
    render(<Funnel sales />);
    expect(document.querySelector(".yt-facade img")?.getAttribute("src")).toBe("https://i.ytimg.com/vi/8nv-QpoVG6w/maxresdefault.jpg");
    fireEvent.click(screen.getByRole("button", { name: /Assistir ao vídeo/ }));
    expect(document.querySelector("iframe")?.getAttribute("src")).toContain("https://www.youtube.com/embed/8nv-QpoVG6w?autoplay=1&playsinline=1&rel=0&enablejsapi=1");
  });

  it("does not load the YouTube player until the lead taps the video", () => {
    render(<Funnel sales />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.querySelector(".yt-facade")).not.toBeNull();
  });
});

describe("Offer page checkout links", () => {
  it("points every protocol CTA to the new checkout with the pixel parameter", () => {
    render(<Funnel sales />);
    const links = Array.from(document.querySelectorAll('a[href*="checkout.payt.com.br"]'));
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(
        "https://checkout.payt.com.br/4fb65cf31f381637d0de7f4029c97fea?pixelfb=1671048727876935&payment=pix",
      );
    }
  });
});
describe("Next screen images", () => {
  it("downloads the next screen's images in the background", async () => {
    const requested: string[] = [];
    class FakeImage {
      decoding = "";
      fetchPriority = "";
      set src(url: string) { requested.push(url); }
    }
    vi.stubGlobal("Image", FakeImage);
    try {
      // Módulo novo: os outros testes já pediram essas imagens (e o código não pede duas vezes).
      vi.resetModules();
      const { Funnel: FreshFunnel } = await import("./funnel");
      render(<FreshFunnel />);
      // Tela 0: já busca as duas fotos da escolha homem/mulher (tela 1).
      await waitFor(() => expect(requested).toEqual(expect.arrayContaining(["/media/40bac08c6022.webp", "/media/879bb17741aa.webp"])), { timeout: 4000 });
      // Tela 1 (escolha): ainda sem gênero, busca as duas versões da tela 2.
      fireEvent.click(screen.getByRole("button", { name: "QUERO APRENDER TAMBÉM !" }));
      await waitFor(() => expect(requested).toEqual(expect.arrayContaining(["/media/1005f839f3fd.webp", "/media/homem-sintomas.webp"])), { timeout: 4000 });
      fireEvent.click(screen.getByRole("button", { name: /Homem/ }));
      expect(new Set(requested).size).toBe(requested.length); // nada é baixado duas vezes
    } finally {
      vi.unstubAllGlobals();
    }
  }, 15000); // no jsdom as imagens nunca terminam: o código espera os 2,5 s de segurança
});
