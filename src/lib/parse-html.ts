import htmlToDOM from "html-dom-parser/lib/server/html-to-dom";
import type { DOMNode } from "html-react-parser";

// O conteúdo do funil é HTML (funnel-content.json) convertido em React.
//
// Por padrão, o html-react-parser escolhe um parser diferente para cada ambiente: no
// navegador usa o DOMParser, e no Worker da Cloudflare cai na versão de navegador, que
// precisa de `document` e quebra. Quando isso acontecia, a página saía do servidor vazia e
// só aparecia depois de todo o JavaScript carregar (erro 419 do React).
//
// Aqui usamos o mesmo parser (htmlparser2, sem dependência de DOM) nos dois lados. Assim o
// servidor entrega a tela pronta e o navegador monta exatamente a mesma árvore.

// O DOMParser do navegador corrige a caixa de nomes do SVG ("viewbox" -> "viewBox") e o
// htmlparser2 não. Repetimos a correção para a árvore ficar idêntica à do navegador.
// Lista conforme a especificação HTML ("adjust SVG attributes" / "adjust SVG tag names").
const SVG_ATTRS: Record<string, string> = {
  attributename: "attributeName",
  attributetype: "attributeType",
  basefrequency: "baseFrequency",
  baseprofile: "baseProfile",
  calcmode: "calcMode",
  clippathunits: "clipPathUnits",
  diffuseconstant: "diffuseConstant",
  edgemode: "edgeMode",
  filterunits: "filterUnits",
  glyphref: "glyphRef",
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
  limitingconeangle: "limitingConeAngle",
  markerheight: "markerHeight",
  markerunits: "markerUnits",
  markerwidth: "markerWidth",
  maskcontentunits: "maskContentUnits",
  maskunits: "maskUnits",
  numoctaves: "numOctaves",
  pathlength: "pathLength",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
  patternunits: "patternUnits",
  pointsatx: "pointsAtX",
  pointsaty: "pointsAtY",
  pointsatz: "pointsAtZ",
  preservealpha: "preserveAlpha",
  preserveaspectratio: "preserveAspectRatio",
  primitiveunits: "primitiveUnits",
  refx: "refX",
  refy: "refY",
  repeatcount: "repeatCount",
  repeatdur: "repeatDur",
  requiredextensions: "requiredExtensions",
  requiredfeatures: "requiredFeatures",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  spreadmethod: "spreadMethod",
  startoffset: "startOffset",
  stddeviation: "stdDeviation",
  stitchtiles: "stitchTiles",
  surfacescale: "surfaceScale",
  systemlanguage: "systemLanguage",
  tablevalues: "tableValues",
  targetx: "targetX",
  targety: "targetY",
  textlength: "textLength",
  viewbox: "viewBox",
  viewtarget: "viewTarget",
  xchannelselector: "xChannelSelector",
  ychannelselector: "yChannelSelector",
  zoomandpan: "zoomAndPan",
};
const SVG_TAGS: Record<string, string> = {
  altglyph: "altGlyph",
  altglyphdef: "altGlyphDef",
  altglyphitem: "altGlyphItem",
  animatecolor: "animateColor",
  animatemotion: "animateMotion",
  animatetransform: "animateTransform",
  clippath: "clipPath",
  feblend: "feBlend",
  fecolormatrix: "feColorMatrix",
  fecomponenttransfer: "feComponentTransfer",
  fecomposite: "feComposite",
  feconvolvematrix: "feConvolveMatrix",
  fediffuselighting: "feDiffuseLighting",
  fedisplacementmap: "feDisplacementMap",
  fedistantlight: "feDistantLight",
  fedropshadow: "feDropShadow",
  feflood: "feFlood",
  fefunca: "feFuncA",
  fefuncb: "feFuncB",
  fefuncg: "feFuncG",
  fefuncr: "feFuncR",
  fegaussianblur: "feGaussianBlur",
  feimage: "feImage",
  femerge: "feMerge",
  femergenode: "feMergeNode",
  femorphology: "feMorphology",
  feoffset: "feOffset",
  fepointlight: "fePointLight",
  fespecularlighting: "feSpecularLighting",
  fespotlight: "feSpotLight",
  fetile: "feTile",
  feturbulence: "feTurbulence",
  foreignobject: "foreignObject",
  glyphref: "glyphRef",
  lineargradient: "linearGradient",
  radialgradient: "radialGradient",
  textpath: "textPath",
};

type Node = DOMNode & { name?: string; attribs?: Record<string, string>; children?: DOMNode[] };

function adjustSvg(nodes: DOMNode[], inSvg: boolean): void {
  for (const node of nodes as Node[]) {
    if (!node.attribs || !node.name) continue;
    const svg = inSvg || node.name === "svg";
    if (svg) {
      node.name = SVG_TAGS[node.name] ?? node.name;
      for (const key of Object.keys(node.attribs)) {
        const fixed = SVG_ATTRS[key];
        if (fixed && !(fixed in node.attribs)) {
          // Recria o objeto para manter a ordem original dos atributos.
          node.attribs = Object.fromEntries(
            Object.entries(node.attribs).map(([k, v]) => [k === key ? fixed : k, v]),
          );
        }
      }
    }
    // Dentro de <foreignObject> o conteúdo volta a ser HTML comum.
    if (node.children) adjustSvg(node.children, svg && node.name !== "foreignObject");
  }
}

// O conteúdo é fixo: cada tela é convertida uma única vez e reaproveitada nas próximas
// renderizações (marcar uma caixinha não converte o HTML de novo).
const cache = new Map<string, DOMNode[]>();

export function parseFunnelHtml(html: string): DOMNode[] {
  let dom = cache.get(html);
  if (!dom) {
    dom = htmlToDOM(html, { lowerCaseAttributeNames: false }) as DOMNode[];
    adjustSvg(dom, false);
    cache.set(html, dom);
  }
  return dom;
}
