import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./audio-player";

// jsdom não tem PointerEvent: sem isso, clientX/button do toque chegam vazios.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

function setup(duration = 100) {
  render(<AudioPlayer src="/media/teste.mp3" />);
  const audio = document.querySelector("audio")!;
  Object.defineProperty(audio, "duration", { configurable: true, value: duration });
  fireEvent(audio, new Event("loadedmetadata"));
  const bars = screen.getByRole("slider", { name: "Posição do áudio" });
  // jsdom não calcula layout: a onda ocupa 0..200 px.
  bars.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 34, right: 200, bottom: 34, x: 0, y: 0, toJSON: () => ({}) });
  return { audio, bars };
}

// O servidor não aceita pedidos parciais: na primeira busca o player baixa o arquivo inteiro.
const fetchMock = vi.fn(async () => new Response(new Blob(["mp3"], { type: "audio/mpeg" })));
beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:audio-completo");
  URL.revokeObjectURL = vi.fn();
  // jsdom não toca mídia.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Espera a cópia completa ficar pronta (o jsdom não carrega áudio: avisamos o "carregou").
async function fullCopyReady(audio: HTMLAudioElement) {
  await vi.waitFor(() => expect(audio.getAttribute("src")).toBe("blob:audio-completo"));
  await act(async () => { fireEvent(audio, new Event("loadedmetadata")); });
}

describe("AudioPlayer", () => {
  it("plays straight from the file without downloading anything extra", () => {
    const { audio } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ouvir áudio" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(audio.getAttribute("src")).toBe("/media/teste.mp3");
  });

  it("falls back to a direct seek when the download fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const { audio, bars } = setup(100);
    fireEvent.pointerDown(bars, { button: 0, clientX: 100, pointerId: 1 });
    await vi.waitFor(() => expect(audio.currentTime).toBe(50));
    expect(audio.getAttribute("src")).toBe("/media/teste.mp3");
  });

  it("cycles the speed 1x → 1,5x → 2x → 1x and remembers it", () => {
    const { audio } = setup();
    const rate = screen.getByRole("button", { name: /Velocidade do áudio/ });
    expect(rate.textContent).toBe("1x");
    fireEvent.click(rate);
    expect(rate.textContent).toBe("1,5x");
    expect(audio.playbackRate).toBe(1.5);
    fireEvent.click(rate);
    expect(rate.textContent).toBe("2x");
    expect(audio.playbackRate).toBe(2);
    expect(sessionStorage.getItem("renovarticular-audio-rate")).toBe("2");
    fireEvent.click(rate);
    expect(rate.textContent).toBe("1x");
  });

  it("starts the next audio at the speed chosen before", () => {
    sessionStorage.setItem("renovarticular-audio-rate", "2");
    const { audio } = setup();
    expect(screen.getByRole("button", { name: /Velocidade do áudio/ }).textContent).toBe("2x");
    expect(audio.playbackRate).toBe(2);
  });

  it("downloads the full audio once, then seeks to the dragged point", async () => {
    const { audio, bars } = setup(100);
    fireEvent.pointerDown(bars, { button: 0, clientX: 50, pointerId: 1 });
    expect(bars.getAttribute("aria-valuenow")).toBe("25"); // a bolinha já acompanha o dedo
    fireEvent.pointerMove(bars, { clientX: 150, pointerId: 1 });
    await fullCopyReady(audio);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/media/teste.mp3");
    expect(audio.currentTime).toBe(75); // vale o último ponto do arraste
    fireEvent.pointerMove(bars, { clientX: 100, pointerId: 1 });
    expect(audio.currentTime).toBe(50); // com a cópia pronta, a busca é imediata
    fireEvent.pointerMove(bars, { clientX: 150, pointerId: 1 });
    expect(audio.currentTime).toBe(75);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(bars, { pointerId: 1 });
    // Depois de soltar, mover o dedo não muda mais o trecho.
    fireEvent.pointerMove(bars, { clientX: 10, pointerId: 1 });
    expect(audio.currentTime).toBe(75);
    expect(bars.getAttribute("aria-valuenow")).toBe("75");
  });

  it("keeps the seek inside the audio when dragging past the ends", async () => {
    const { audio, bars } = setup(100);
    fireEvent.pointerDown(bars, { button: 0, clientX: 500, pointerId: 1 });
    await fullCopyReady(audio);
    expect(audio.currentTime).toBe(100);
    fireEvent.pointerMove(bars, { clientX: -40, pointerId: 1 });
    expect(audio.currentTime).toBe(0);
  });

  it("moves 5 seconds with the arrow keys", async () => {
    const { audio, bars } = setup(100);
    fireEvent.keyDown(bars, { key: "ArrowRight" });
    await fullCopyReady(audio);
    expect(audio.currentTime).toBe(5);
    fireEvent.keyDown(bars, { key: "ArrowLeft" });
    expect(audio.currentTime).toBe(0);
  });
});
