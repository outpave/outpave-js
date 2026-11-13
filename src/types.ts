export interface LoadEmbeddedOptions {
  /** The loader your platform serves, such as `https://APP_HOST/embedded/v1/loader.js`. */
  loaderUrl: string;
}

export interface EmbeddedV1 {
  version: "1";
  mount: (options: MountOptions) => EmbeddedInstance;
}

export type MountOptions = SessionMountOptions | CardViewerMountOptions;

export interface EmbeddedInstance {
  restart: () => void;
  unmount: () => void;
}

/** An element, or a CSS selector that matches one. */
export type EmbeddedContainer = HTMLElement | string;

export type EmbeddedErrorCode =
  | "FRAME_UNAVAILABLE"
  | "SESSION_UNAVAILABLE"
  | "COMPONENT_UNAVAILABLE"
  | "REQUEST_FAILED"
  | "COMPONENT_FAILED";

export type EmbeddedColorScheme = "light" | "dark";

export interface EmbeddedSessionEvent {
  embeddedSessionId: string;
}

export interface EmbeddedErrorEvent {
  code: EmbeddedErrorCode;
  embeddedSessionId?: string;
}

export interface SessionMountOptions {
  container: EmbeddedContainer;
  clientToken?: string;
  /** Called on mount and on every restart; each client token is redeemable once. */
  getClientToken?: () => string | Promise<string>;
  title?: string;
  locale?: string;
  colorScheme?: EmbeddedColorScheme;
  onReady?: (event: EmbeddedSessionEvent) => void;
  /** Advisory only: read the session or its resource from your backend for the outcome. */
  onComplete?: (event: EmbeddedSessionEvent) => void;
  onCancel?: (event: EmbeddedSessionEvent) => void;
  onExpire?: (event: EmbeddedSessionEvent) => void;
  onError?: (event: EmbeddedErrorEvent) => void;
}

export type CardViewerField = "cardNumber" | "expirationDate" | "cvv";

/** The `cardToken` of `GET /api/v2/cards/{cardId}?extend=cardToken`, passed on unchanged. */
export type CardToken = object;

export interface CardViewerTextStyle {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface CardViewerStyle {
  base?: CardViewerTextStyle;
}

export interface CardViewerErrorEvent {
  code: "CARD_UNAVAILABLE";
}

export interface CardViewerCopyEvent {
  field: CardViewerField;
}

export interface CardViewerMountOptions {
  container: EmbeddedContainer;
  cardToken: CardToken;
  labels?: Partial<Record<CardViewerField, string>>;
  style?: CardViewerStyle;
  onReady?: () => void;
  onError?: (event: CardViewerErrorEvent) => void;
  onCopy?: (event: CardViewerCopyEvent) => void;
}
