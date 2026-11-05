import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { domToReact, Element, attributesToProps, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { parseFunnelHtml } from "@/lib/parse-html";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { VideoFacade } from "@/components/video-facade";
import { sourceAssets } from "@/lib/source-assets";
import content from "@/lib/funnel-content.json";
import { funnelImage, funnelVideo } from "@/lib/funnel-media";
import { prefetchImages, stepImageUrls } from "@/lib/prefetch-images";
export { maleSuccessVideo } from "@/lib/funnel-media";
import { PIXEL_ID, trackFunnelLandingViewed, trackOfferPageReached, trackQuizAudioCompleted, trackQuizAudioStarted, trackQuizCheckoutClick, trackQuizStarted, trackQuizStep, trackQuizVideoPageReached } from "@/lib/meta-pixel";
import { captureTrackingParams, readTrackingParams, withTrackingParams } from "@/lib/tracking-params";

export const checkoutUrl = `https://checkout.payt.com.br/4fb65cf31f381637d0de7f4029c97fea?pixelfb=${PIXEL_ID}&payment=pix`;

const GENDER_KEY = "renovarticular-gender";
// Quem passou pelo quiz e clicou em "Voltar" na oferta volta para a última tela do quiz (26),
// e não para o começo. Quem entrou direto na oferta volta para o início.
const QUIZ_DONE_KEY = "renovarticular-quiz-done";
const RESUME_KEY = "renovarticular-resume-step";

function resumeStep(): number {
  if (typeof window === "undefined") return 0;
  try { return window.sessionStorage.getItem(RESUME_KEY) === "26" ? 26 : 0; } catch { return 0; }
}

const BACK_ARROW = <svg className="funnel-back-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
export const REQUIRED_ANSWER_MESSAGE = "Selecione uma das alternativas acima";

export function Funnel({ sales = false, basePath = "" }: { sales?: boolean; basePath?: "" | "/renovac" }) {
  const [step, setStep] = useState(() => (sales ? 27 : resumeStep()));
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [progress, setProgress] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [checkoutHref, setCheckoutHref] = useState(checkoutUrl);
  // Telas de múltipla escolha: aviso quando o lead tenta avançar sem marcar nenhuma opção.
  const [showRequired, setShowRequired] = useState(false);
  const navigate = useNavigate();
  const current = content[step];
  const homeRoute = basePath || "/";
  const offerRoute = basePath ? "/renovac/oferta" : "/oferta";
  useEffect(() => {
    window.sessionStorage.removeItem(RESUME_KEY);
    const saved = window.sessionStorage.getItem(GENDER_KEY);
    if (saved) setGender(saved);
    captureTrackingParams(window.location.search);
    setCheckoutHref(withTrackingParams(checkoutUrl, readTrackingParams()));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    setProgress(0);
    setShowRequired(false);
  }, [step]);
  useEffect(() => {
    trackQuizStep(step);
    if (step === 0) trackFunnelLandingViewed();
    if (sales) trackOfferPageReached();
    if (current?.html.includes("<iframe")) trackQuizVideoPageReached(step);
  }, [step, current?.html, sales]);
  // Depois que as imagens da tela atual terminam de carregar (ou em até 2,5 s), baixa em
  // segundo plano as da próxima tela. A tela 25 (processando) não tem imagens: pula para a 26.
  const chosenGender = answers[1]?.[0] ?? gender;
  useEffect(() => {
    let cancelled = false;
    const nextSteps = step + 1 === 25 ? [25, 26] : [step + 1];
    const go = () => {
      if (cancelled) return;
      cancelled = true;
      for (const s of nextSteps) prefetchImages(stepImageUrls(s, chosenGender));
    };
    const pending = [...document.querySelectorAll<HTMLImageElement>(".source-funnel img")].filter((img) => !img.complete);
    let left = pending.length;
    const onDone = () => { if (--left <= 0) go(); };
    pending.forEach((img) => { img.addEventListener("load", onDone, { once: true }); img.addEventListener("error", onDone, { once: true }); });
    const timer = window.setTimeout(go, left ? 2500 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      pending.forEach((img) => { img.removeEventListener("load", onDone); img.removeEventListener("error", onDone); });
    };
  }, [step, chosenGender]);
  useEffect(() => {
    if (step !== 25) return;
    const interval = window.setInterval(() => setProgress((p) => Math.min(p + 5, 100)), 150);
    const timer = window.setTimeout(() => setStep(26), 3300);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [step]);
  if (!current) return null;
  const next = () => {
    if (step === 26) {
      window.sessionStorage.setItem(QUIZ_DONE_KEY, "1");
      void navigate({ to: offerRoute });
      return;
    }
    setStep((s) => Math.min(26, s + 1));
  };
  const back = () => {
    if (sales) {
      if (window.sessionStorage.getItem(QUIZ_DONE_KEY)) window.sessionStorage.setItem(RESUME_KEY, "26");
      void navigate({ to: homeRoute });
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return undefined;
      const children = () => domToReact(node.children as DOMNode[], options);
      const attrs = attributesToProps(node.attribs);
      if (node.name === "img") {
        const src = funnelImage(step, node.attribs["data-clone-node"] || "", chosenGender, sourceAssets[node.attribs["src"] || ""]);
        return <img {...attrs} src={src} alt={node.attribs["alt"] || "Protocolo RenovArticular"} />;
      }
      if (node.attribs["data-audio"]) {
        const audioSrc = sourceAssets[node.attribs["data-audio"]];
        return <div className="clone-audio">{audioSrc ? <AudioPlayer src={audioSrc} onPlay={() => trackQuizAudioStarted(step)} onComplete={() => trackQuizAudioCompleted(step)} /> : null}</div>;
      }
      if (node.name === "iframe") {
        const src = funnelVideo(step, node.attribs["data-clone-node"] || "", chosenGender, node.attribs["src"] || "");
        // key={src}: se o vídeo trocar (ex.: caminho masculino), volta a mostrar a capa do novo.
        return <VideoFacade key={src} className={node.attribs["class"]} src={src} title={node.attribs["title"] || "Depoimento"} />;
      }
      if (node.name === "a") {
        return <span className={node.attribs["class"]}>{children()}</span>;
      }
      if (node.name === "button") {
        const action = node.attribs["data-action"];
        const answer = node.attribs["data-answer"] || "";
        const selected = answers[step]?.includes(answer) || false;
        if (action === "purchase") {
          return <Button variant="source" asChild className={node.attribs["class"]}><a href={checkoutHref} rel="noopener noreferrer" onClick={trackQuizCheckoutClick}>{children()}</a></Button>;
        }
        if (action === "expand") return <div className={node.attribs["class"]}>{children()}</div>;
        // Voltar: botão "← Voltar" no canto superior esquerdo. O espaço original (a setinha)
        // continua ocupado para o logo não sair do lugar; o botão fica por cima dele.
        // Voltar e avançar de novo não repete eventos do Pixel: cada evento do quiz só é
        // enviado uma vez por sessão (ver meta-pixel.ts).
        if (action === "back") {
          return <span className={`${node.attribs["class"]} funnel-back-slot`}><button type="button" className="funnel-back" data-action="back" onClick={back}>{BACK_ARROW}<span>Voltar</span></button></span>;
        }
        // Avançar em tela de caixinhas sem nada marcado: o botão fica mais claro (aria-disabled),
        // mas continua clicável para poder mostrar o aviso em vermelho logo abaixo dele.
        const locked = action === "next" && current.multiple && !(answers[step]?.length);
        const button = <Button variant="source" type="button" data-action={action} className={`${node.attribs["class"]} ${selected ? "clone-selected" : ""}`} aria-label={action === "back" ? "Voltar" : undefined} aria-pressed={action === "toggle" ? selected : undefined} aria-disabled={locked || undefined} aria-describedby={locked && showRequired ? "quiz-required-error" : undefined} onClick={() => {
          if (action === "back") { back(); return; }
          if (locked) { setShowRequired(true); return; }
          if (action === "next" && step === 0) trackQuizStarted();
          if (action === "toggle") {
            setShowRequired(false);
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
        if (action !== "next" || !current.multiple) return button;
        // Mesma estrutura sempre (botão + espaço do aviso): o botão não é recriado quando o aviso aparece.
        return <>{button}{locked && showRequired ? <p id="quiz-required-error" className="quiz-required-error" role="alert">{REQUIRED_ANSWER_MESSAGE}</p> : null}</>;
      }
      return undefined;
    },
  };
  if (step === 25) return <main className="funnel-page"><div className="funnel-column processing"><h1 className="quiz-title">Estou analisando as suas respostas e gerando o seu protocolo personalizado.</h1><p className="quiz-description">Montando protocolo personalizado</p><progress className="quiz-progress" max={100} value={progress} /><p className="quiz-description">{progress}%</p><p className="quiz-description">Estamos analisando suas respostas</p></div></main>;
  return (
    <div className="source-funnel" data-step={step} data-next-locked={(current.multiple && !answers[step]?.length) || undefined}>
      {domToReact(parseFunnelHtml(current.html), options)}
    </div>
  );
}
