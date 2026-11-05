import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./audio-player";

// Simula o áudio tocando de `from` até `to` (timeupdate a cada 0,25 s, como no navegador).
function play(audio: HTMLAudioElement, from: number, to: number, every = 0.25) {
  for (let t = from; t <= to; t += every) {
    audio.currentTime = t;
    fireEvent(audio, new Event("timeupdate"));
  }
}

// Ordem do navegador num pulo de trecho: seeking → timeupdate → seeked.
function jump(audio: HTMLAudioElement, t: number) {
  fireEvent(audio, new Event("seeking"));
  audio.currentTime = t;
  fireEvent(audio, new Event("timeupdate"));
  fireEvent(audio, new Event("seeked"));
}

function setup(duration = 100) {
  const onComplete = vi.fn();
  render(<AudioPlayer src="/media/teste.mp3" onComplete={onComplete} />);
  const audio = document.querySelector("audio")!;
  Object.defineProperty(audio, "duration", { configurable: true, value: duration });
  fireEvent(audio, new Event("loadedmetadata"));
  return { audio, onComplete };
}

beforeEach(() => {
  // jsdom não toca mídia.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("AudioPlayer", () => {
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

  it("has no control to drag the audio to another point", () => {
    setup();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(document.querySelector(".wa-bars")?.getAttribute("aria-hidden")).toBe("true");
  });

  describe("AudioCompleted", () => {
    it("fires when the lead listened to the whole audio", () => {
      const { audio, onComplete } = setup();
      play(audio, 0, 100);
      fireEvent(audio, new Event("ended"));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("still counts when the phone updates less often", () => {
      const { audio, onComplete } = setup();
      play(audio, 0, 100, 4);
      fireEvent(audio, new Event("ended"));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not fire when the audio jumped to the end without being heard", () => {
      const { audio, onComplete } = setup();
      play(audio, 0, 10);
      jump(audio, 97);
      play(audio, 97, 100);
      fireEvent(audio, new Event("ended"));
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("fires when only a small part was skipped (80% or more heard)", () => {
      const { audio, onComplete } = setup();
      play(audio, 0, 50);
      jump(audio, 60);
      play(audio, 60, 100);
      fireEvent(audio, new Event("ended"));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not count the same stretch twice", () => {
      const { audio, onComplete } = setup();
      for (let i = 0; i < 3; i++) {
        play(audio, 0, 30);
        jump(audio, 0);
      }
      jump(audio, 98);
      play(audio, 98, 100);
      fireEvent(audio, new Event("ended"));
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
