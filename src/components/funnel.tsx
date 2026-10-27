import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import parse, { domToReact, Element, attributesToProps, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { sourceAssets } from "@/lib/source-assets";
import content from "@/lib/funnel-content.json";
import { funnelImage, funnelVideo } from "@/lib/funnel-media";
export { maleSuccessVideo } from "@/lib/funnel-media";
import { PIXEL_ID } from "@/lib/meta-pixel";
import { captureTrackingParams, readTrackingParams, withTrackingParams } from "@/lib/tracking-params";

export const checkoutUrl = `https://checkout.payt.com.br/4fb65cf31f381637d0de7f4029c97fea?pixelfb=${PIXEL_ID}`;

const GENDER_KEY = "renovarticular-gender";

export function Funnel({ sales = false }: { sales?: boolean }) {
  const [step, setStep] = useState(sales ? 27 : 0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [progress, setProgress] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [checkoutHref, setCheckoutHref] = useState(checkoutUrl);
  const navigate = useNavigate();
  const current = content[step];
  useEffect(() => {
    const saved = window.sessionStorage.getItem(GENDER_KEY);
    if (saved) setGender(saved);
    captureTrackingParams(window.location.search);
    setCheckoutHref(withTrackingParams(checkoutUrl, readTrackingParams()));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    setProgress(0);
  }, [step]);
  useEffect(() => {
    if (step !== 25) return;
    const interval = window.setInterval(() => setProgress((p) => Math.min(p + 5, 100)), 150);
    const timer = window.setTimeout(() => setStep(26), 3300);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [step]);
  if (!current) return null;
  const currentGender = answers[1]?.[0] ?? gender;
  const next = () => {
    if (step === 26) { void navigate({ to: "/oferta" }); return; }
    setStep((s) => Math.min(26, s + 1));
  };
  const back = () => {
    if (sales) { void navigate({ to: "/" }); return; }
    setStep((s) => Math.max(0, s - 1));
  };
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return undefined;
      const children = () => domToReact(node.children as DOMNode[], options);
      const attrs = attributesToProps(node.attribs);
      if (node.name === "img") {
        const src = funnelImage(step, node.attribs["data-clone-node"] || "", currentGender, sourceAssets[node.attribs["src"] || ""]);
        return <img {...attrs} src={src} alt={node.attribs["alt"] || "Protocolo RenovArticular"} />;
      }
      if (node.attribs["data-audio"]) {
        const audioSrc = sourceAssets[node.attribs["data-audio"]];
        return <div className="clone-audio">{audioSrc ? <AudioPlayer src={audioSrc} /> : null}</div>;
      }
      if (node.name === "iframe") {
        const src = funnelVideo(step, node.attribs["data-clone-node"] || "", currentGender, node.attribs["src"] || "");
        return <iframe className={node.attribs["class"]} src={src} title={node.attribs["title"] || "Depoimento"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
      }
      if (node.name === "a") {
        return <span className={node.attribs["class"]}>{children()}</span>;
      }
      if (node.name === "button") {
        const action = node.attribs["data-action"];
        const answer = node.attribs["data-answer"] || "";
        const selected = answers[step]?.includes(answer) || false;
        if (action === "purchase") {
          return <Button variant="source" asChild className={node.attribs["class"]}><a href={checkoutHref} rel="noopener noreferrer">{children()}</a></Button>;
        }
        if (action === "expand") return <div className={node.attribs["class"]}>{children()}</div>;
        return <Button variant="source" type="button" data-action={action} className={`${node.attribs["class"]} ${selected ? "clone-selected" : ""}`} aria-label={action === "back" ? "Voltar" : undefined} aria-pressed={action === "toggle" ? selected : undefined} disabled={action === "next" && current.multiple && !(answers[step]?.length)} onClick={() => {
          if (action === "back") { back(); return; }
          if (action === "toggle") {
            setAnswers((old) => ({ ...old, [step]: selected ? (old[step] || []).filter((a) => a !== answer) : [...(old[step] || []), answer] }));
            return;
          }
          if (answer !== "Continuar") {
            setAnswers((old) => ({ ...old, [step]: [answer] }));
            if (step === 1) {
              setGender(answer);
              window.sessionStorage.setItem(GENDER_KEY, answer);
            }
          }
          next();
        }}>{children()}</Button>;
      }
      return undefined;
    },
  };
  if (step === 25) return <main className="funnel-page"><div className="funnel-column processing"><h1 className="quiz-title">Estou analisando as suas respostas e gerando o seu protocolo personalizado.</h1><p className="quiz-description">Montando protocolo personalizado</p><progress className="quiz-progress" max={100} value={progress} /><p className="quiz-description">{progress}%</p><p className="quiz-description">Estamos analisando suas respostas</p></div></main>;
  return (
    <div className="source-funnel" data-step={step}>
      {parse(current.html, options)}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, opacity: 0.6 }}>
        <Link to="/privacidade" style={{ textDecoration: "underline", color: "inherit" }}>Política de Privacidade</Link>
      </p>
    </div>
  );
}