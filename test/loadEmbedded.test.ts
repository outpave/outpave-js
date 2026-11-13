import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmbeddedV1, LoadEmbeddedOptions } from "../src/index.js";

type EmbeddedWindow = Window & { OutpaveEmbedded?: { v1?: EmbeddedV1 } };

const LOADER_URL = "https://app.example.com/embedded/v1/loader.js";

const getLoadEmbedded = async () =>
  (await import("../src/index.js")).loadEmbedded;

const getScripts = () =>
  Array.from(document.head.querySelectorAll<HTMLScriptElement>("script"));

const getSdk = (): EmbeddedV1 => ({ version: "1", mount: vi.fn() });

function finishLoading(script: HTMLScriptElement, sdk?: EmbeddedV1) {
  (window as EmbeddedWindow).OutpaveEmbedded = sdk && { v1: sdk };
  script.dispatchEvent(new Event("load"));
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  document.head.replaceChildren();
  delete (window as EmbeddedWindow).OutpaveEmbedded;
});

describe("loadEmbedded", () => {
  it("adds the loader once and resolves the SDK it defines", async () => {
    const loadEmbedded = await getLoadEmbedded();
    const first = loadEmbedded({ loaderUrl: LOADER_URL });
    const second = loadEmbedded({ loaderUrl: LOADER_URL });

    const scripts = getScripts();
    expect(scripts.map((script) => script.src)).toEqual([LOADER_URL]);
    const sdk = getSdk();
    finishLoading(scripts[0], sdk);

    await expect(first).resolves.toBe(sdk);
    await expect(second).resolves.toBe(sdk);
    await expect(loadEmbedded({ loaderUrl: LOADER_URL })).resolves.toBe(sdk);
    expect(getScripts()).toHaveLength(1);
  });

  it("keeps the SDK each loader defined", async () => {
    const loadEmbedded = await getLoadEmbedded();
    const otherUrl = "https://app.example.org/embedded/v1/loader.js";
    const first = loadEmbedded({ loaderUrl: LOADER_URL });
    const second = loadEmbedded({ loaderUrl: otherUrl });
    const [firstScript, secondScript] = getScripts();
    const firstSdk = getSdk();
    const secondSdk = getSdk();
    finishLoading(firstScript, firstSdk);
    finishLoading(secondScript, secondSdk);

    await expect(first).resolves.toBe(firstSdk);
    await expect(second).resolves.toBe(secondSdk);
  });

  it("rejects when the loader fails and loads it again on the next call", async () => {
    const loadEmbedded = await getLoadEmbedded();
    const failed = loadEmbedded({ loaderUrl: LOADER_URL });
    getScripts()[0].dispatchEvent(new Event("error"));

    await expect(failed).rejects.toThrow(`Could not load ${LOADER_URL}.`);
    expect(getScripts()).toHaveLength(0);

    const retried = loadEmbedded({ loaderUrl: LOADER_URL });
    const sdk = getSdk();
    finishLoading(getScripts()[0], sdk);
    await expect(retried).resolves.toBe(sdk);
  });

  it("rejects when the script defines no v1 SDK", async () => {
    const loadEmbedded = await getLoadEmbedded();
    const load = loadEmbedded({ loaderUrl: "https://app.example.com/app.js" });
    finishLoading(getScripts()[0]);

    await expect(load).rejects.toThrow(
      "did not define window.OutpaveEmbedded.v1",
    );
    expect(getScripts()).toHaveLength(0);
  });

  it("rejects a loader URL that is not HTTPS, except on a local host", async () => {
    const loadEmbedded = await getLoadEmbedded();
    const refused = [
      "http://app.example.com/embedded/v1/loader.js",
      "/embedded/v1/loader.js",
      undefined,
    ];
    for (const loaderUrl of refused) {
      await expect(
        loadEmbedded({ loaderUrl } as LoadEmbeddedOptions),
      ).rejects.toThrow(TypeError);
    }
    expect(getScripts()).toHaveLength(0);

    void loadEmbedded({
      loaderUrl: "http://localhost:3000/embedded/v1/loader.js",
    });
    expect(getScripts()).toHaveLength(1);
  });

  it("resolves null without a window", async () => {
    const loadEmbedded = await getLoadEmbedded();
    vi.stubGlobal("window", undefined);

    await expect(loadEmbedded({ loaderUrl: LOADER_URL })).resolves.toBeNull();
    expect(getScripts()).toHaveLength(0);
  });
});
