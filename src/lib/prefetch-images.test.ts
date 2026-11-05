import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import content from "@/lib/funnel-content.json";
import { stepImageUrls } from "./prefetch-images";

const file = (url: string) => path.join(process.cwd(), "public", url);

describe("stepImageUrls", () => {
  it("every image of every screen exists in public/media (both audiences)", () => {
    const missing: string[] = [];
    content.forEach((_, step) => {
      for (const gender of ["Mulher", "Homem"]) {
        for (const url of stepImageUrls(step, gender)) if (!fs.existsSync(file(url))) missing.push(`${step}: ${url}`);
      }
    });
    expect(missing).toEqual([]);
  });

  it("screen 1 (choose man or woman) brings both photos", () => {
    const urls = stepImageUrls(1, null);
    expect(urls).toContain("/media/40bac08c6022.webp");
    expect(urls).toContain("/media/879bb17741aa.webp");
  });

  it("before the gender is known, brings both versions of a screen", () => {
    expect(stepImageUrls(2, null)).toEqual(expect.arrayContaining(["/media/1005f839f3fd.webp", "/media/homem-sintomas.webp"]));
  });

  it("after the gender is chosen, brings only that version", () => {
    expect(stepImageUrls(2, "Homem")).toContain("/media/homem-sintomas.webp");
    expect(stepImageUrls(2, "Homem")).not.toContain("/media/1005f839f3fd.webp");
    expect(stepImageUrls(8, "Mulher")).toContain("/media/a33e60c9be5e.webp");
    expect(stepImageUrls(8, "Mulher")).not.toContain("/media/homem-noticia.webp");
  });

  it("uses the shared comparison table on screen 26", () => {
    expect(stepImageUrls(26, "Mulher")).toContain("/media/tabela-protocolo.webp");
  });

  it("returns nothing past the last screen", () => {
    expect(stepImageUrls(content.length, "Mulher")).toEqual([]);
  });
});
