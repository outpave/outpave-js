import type { EmbeddedV1, LoadEmbeddedOptions } from "./types.js";

export type {
  CardToken,
  CardViewerCopyEvent,
  CardViewerErrorEvent,
  CardViewerField,
  CardViewerMountOptions,
  CardViewerStyle,
  CardViewerTextStyle,
  EmbeddedColorScheme,
  EmbeddedContainer,
  EmbeddedErrorCode,
  EmbeddedErrorEvent,
  EmbeddedInstance,
  EmbeddedSessionEvent,
  EmbeddedV1,
  LoadEmbeddedOptions,
  MountOptions,
  SessionMountOptions,
} from "./types.js";

interface EmbeddedWindow extends Window {
  OutpaveEmbedded?: { v1?: EmbeddedV1 };
}

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];

const loads = new Map<string, Promise<EmbeddedV1>>();

/** Resolves null where there is no window, such as during server rendering. */
export async function loadEmbedded(
  options: LoadEmbeddedOptions,
): Promise<EmbeddedV1 | null> {
  if (typeof window === "undefined") return null;
  const loaderUrl = getLoaderUrl(options?.loaderUrl);
  const pending = loads.get(loaderUrl);
  if (pending) return pending;

  const load = injectLoader(loaderUrl);
  loads.set(loaderUrl, load);
  load.catch(() => loads.delete(loaderUrl));
  return load;
}

function getLoaderUrl(value: unknown): string {
  const url = typeof value === "string" ? getUrl(value) : null;
  if (
    url?.protocol === "https:" ||
    (url?.protocol === "http:" && LOCAL_HOSTNAMES.includes(url.hostname))
  ) {
    return url.href;
  }
  throw new TypeError(
    "loaderUrl must be the HTTPS URL of your platform's loader, such as https://APP_HOST/embedded/v1/loader.js.",
  );
}

function getUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function injectLoader(loaderUrl: string): Promise<EmbeddedV1> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = loaderUrl;
    script.addEventListener("load", () => {
      const sdk = (window as EmbeddedWindow).OutpaveEmbedded?.v1;
      if (sdk?.version === "1") {
        resolve(sdk);
        return;
      }
      script.remove();
      reject(
        new Error(
          `${loaderUrl} did not define window.OutpaveEmbedded.v1. Pass the URL of your platform's loader, ending in /embedded/v1/loader.js.`,
        ),
      );
    });
    script.addEventListener("error", () => {
      script.remove();
      reject(
        new Error(
          `Could not load ${loaderUrl}. Check the URL, and that your Content Security Policy allows scripts from its host.`,
        ),
      );
    });
    document.head.appendChild(script);
  });
}
