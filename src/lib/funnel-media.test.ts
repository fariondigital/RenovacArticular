import { describe, expect, it } from "vitest";
import { funnelImage, funnelVideo } from "./funnel-media";

describe("Audience-specific funnel media", () => {
  it.each([
    [2, "n30", "/media/homem-sintomas.webp"],
    [8, "n41", "/media/homem-noticia.png"],
    [27, "n59", "/media/homem-antes.webp"],
    [27, "n65", "/media/homem-depois.webp"],
  ])("changes only the male image at step %s node %s", (step, node, expected) => {
    expect(funnelImage(Number(step), node, "Homem", "original")).toBe(expected);
    expect(funnelImage(Number(step), node, "Mulher", "original")).toBe("original");
    expect(funnelImage(Number(step), node, null, "original")).toBe("original");
  });

  it("shares the local comparison table across both audiences", () => {
    for (const gender of ["Homem", "Mulher", null]) {
      expect(funnelImage(26, "n27", gender, "original")).toBe("/media/tabela-protocolo.webp");
    }
  });

  it("preserves every other media slot", () => {
    expect(funnelImage(22, "n71", "Homem", "original")).toBe("original");
    expect(funnelVideo(24, "n384", "Homem", "earlier-video")).toBe("earlier-video");
  });

  it("uses the requested final video for each audience", () => {
    expect(funnelVideo(27, "n384", "Homem", "old")).toBe("https://www.youtube.com/embed/t1tRFlwYxB0");
    expect(funnelVideo(27, "n384", "Mulher", "old")).toBe("https://www.youtube.com/embed/8nv-QpoVG6w");
  });
});
