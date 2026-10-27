import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Funnel, maleSuccessVideo } from "./funnel";

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
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Artrose" }));
    expect(next).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Artrite" }));
    expect(screen.getByRole("button", { name: "Artrose" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Artrite" })).toHaveAttribute("aria-pressed", "true");
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
      const iframe = document.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toBe("https://www.youtube.com/embed/t1tRFlwYxB0");
    });
  });

  it("keeps the default video on the female path", () => {
    sessionStorage.setItem("renovarticular-gender", "Mulher");
    render(<Funnel sales />);
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube.com/embed/8nv-QpoVG6w");
  });
});

describe("Offer page checkout links", () => {
  it("points every protocol CTA to the new checkout with the pixel parameter", () => {
    render(<Funnel sales />);
    const links = Array.from(document.querySelectorAll('a[href*="checkout.payt.com.br"]'));
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(
        "https://checkout.payt.com.br/4fb65cf31f381637d0de7f4029c97fea?pixelfb=1671048727876935",
      );
    }
  });
});