import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playerUrl, VideoFacade } from "./video-facade";

const SRC = "https://www.youtube.com/embed/zHXqFyAQCCg";

// Mensagem que o player do YouTube manda para a página.
function fromYouTube(frame: HTMLIFrameElement, data: unknown) {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(data), origin: "https://www.youtube.com", source: frame.contentWindow }));
  });
}

function open() {
  render(<VideoFacade src={SRC} title="Depoimento" className="clone-512" />);
  fireEvent.click(screen.getByRole("button", { name: /Assistir ao vídeo/ }));
  const frame = document.querySelector("iframe")!;
  fireEvent.load(frame);
  return frame;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("VideoFacade", () => {
  it("shows only the cover until the lead taps", () => {
    render(<VideoFacade src={SRC} title="Depoimento" className="clone-512" />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.querySelector(".yt-facade img")?.getAttribute("src")).toBe("https://i.ytimg.com/vi/zHXqFyAQCCg/maxresdefault.jpg");
  });

  it("keeps the cover with 'Carregando vídeo…' while the player loads, then removes it when the video plays", () => {
    const frame = open();
    expect(frame.getAttribute("src")).toBe(playerUrl(SRC, window.location.origin));
    expect(screen.getByRole("status").textContent).toContain("Carregando vídeo");
    fromYouTube(frame, { event: "onReady" });
    fromYouTube(frame, { event: "onStateChange", info: 3 }); // carregando o vídeo
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByRole("status")).not.toBeNull(); // ainda carregando: a capa fica
    fromYouTube(frame, { event: "infoDelivery", info: { playerState: 1 } }); // tocando
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector(".yt-facade")).toBeNull();
    expect(document.querySelector("iframe")).toBe(frame); // o player não é recarregado
  });

  it("ignores messages that do not come from this player", () => {
    const frame = open();
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify({ event: "onStateChange", info: 1 }), origin: "https://evil.example", source: frame.contentWindow }));
    });
    expect(screen.queryByRole("status")).not.toBeNull();
  });

  it("shows the YouTube player when autoplay is blocked (player ready but not starting)", () => {
    const frame = open();
    fromYouTube(frame, { event: "onReady" });
    act(() => { vi.advanceTimersByTime(2400); });
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the player shortly after it loads if YouTube sends no message", () => {
    open();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("never stays loading forever (player never finishes loading)", () => {
    render(<VideoFacade src={SRC} title="Depoimento" className="clone-512" />);
    fireEvent.click(screen.getByRole("button", { name: /Assistir ao vídeo/ }));
    act(() => { vi.advanceTimersByTime(11900); });
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
