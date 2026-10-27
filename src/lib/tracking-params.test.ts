import { describe, it, expect, beforeEach } from "vitest";
import { captureTrackingParams, readTrackingParams, withTrackingParams } from "./tracking-params";

const base = "https://checkout.payt.com.br/4fb65cf31f381637d0de7f4029c97fea?pixelfb=1671048727876935";

describe("tracking params", () => {
  beforeEach(() => window.sessionStorage.clear());
  it("forwards UTMs to the checkout and keeps pixelfb", () => {
    captureTrackingParams("?utm_source=fb&utm_campaign=c1&foo=x");
    const url = new URL(withTrackingParams(base, readTrackingParams()));
    expect(url.searchParams.get("pixelfb")).toBe("1671048727876935");
    expect(url.searchParams.get("utm_source")).toBe("fb");
    expect(url.searchParams.get("utm_campaign")).toBe("c1");
    expect(url.searchParams.get("foo")).toBeNull();
  });
  it("keeps params after navigating to a page without them", () => {
    captureTrackingParams("?src=ad1");
    captureTrackingParams("");
    expect(readTrackingParams()["src"]).toBe("ad1");
  });
});
