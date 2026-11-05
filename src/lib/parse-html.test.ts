import { describe, expect, it } from "vitest";
import browserHtmlToDOM from "html-dom-parser/lib/client/html-to-dom";
import type { DOMNode } from "html-react-parser";
import content from "@/lib/funnel-content.json";
import { parseFunnelHtml } from "./parse-html";

type Node = {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: Node[];
};

// Representação estável da árvore: tipo, tag, atributos (ordenados), texto e filhos.
function shape(nodes: DOMNode[]): unknown[] {
  return (nodes as unknown as Node[]).map((n) =>
    n.attribs
      ? [
          n.name,
          Object.entries(n.attribs).sort(([a], [b]) => a.localeCompare(b)),
          shape((n.children ?? []) as unknown as DOMNode[]),
        ]
      : [n.type, n.data],
  );
}

describe("parseFunnelHtml", () => {
  it.each(content.map((step, i) => [i, step.html] as const))(
    "tela %i: gera a mesma árvore que o DOMParser do navegador",
    (_, html) => {
      const browser = browserHtmlToDOM(html, {
        lowerCaseAttributeNames: false,
      }) as unknown as DOMNode[];
      expect(shape(parseFunnelHtml(html))).toEqual(shape(browser));
    },
  );

  it("converte cada tela uma única vez", () => {
    const html = content[0]!.html;
    expect(parseFunnelHtml(html)).toBe(parseFunnelHtml(html));
  });
});
