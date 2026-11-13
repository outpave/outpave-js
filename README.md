# outpave-js

Loads the embedded components, the card viewer and document upload, into your page, with TypeScript types.

The package adds your platform's hosted loader to the page and returns its SDK. The components always come from your platform, so your page receives fixes without upgrading this package.

## Install

```bash
npm install outpave-js
```

## Load the SDK

```ts
import { loadEmbedded } from "outpave-js";

const embedded = await loadEmbedded({
  loaderUrl: "https://APP_HOST/embedded/v1/loader.js",
});
```

Replace `APP_HOST` with the domain of the web app assigned to your integration.

- The loader is added once per URL. Later calls return the same SDK.
- Resolves `null` where there is no `window`, such as during server rendering. Call it in the browser, for example in an effect.
- Rejects when the loader cannot be loaded, and tries again on the next call.
- `loaderUrl` must use HTTPS, except on `localhost` and `127.0.0.1`.
- A page with a Content Security Policy allows `https://APP_HOST` in `script-src`.

## Show card details

Your backend reads the card with `GET /api/v2/cards/{cardId}?extend=cardToken` and sends only `cardToken` to the page. Pass it on unchanged.

```ts
const viewer = embedded?.mount({
  container: "#card-details",
  cardToken,
  style: { base: { color: "#1f2933", fontSize: "16px" } },
  onReady: () => {},
  onError: ({ code }) => {
    // CARD_UNAVAILABLE: request a new card token and mount again.
  },
});

viewer?.unmount();
```

## Upload verification documents

Your backend creates a session with `POST /api/v2/embeddedSessions` for the `VERIFICATION_DOCUMENTS` component and returns its one-time `clientToken`.

```ts
const session = embedded?.mount({
  container: "#documents",
  getClientToken: async () => {
    const response = await fetch("/embedded-sessions", { method: "POST" });
    const { clientToken } = await response.json();
    return clientToken;
  },
  onComplete: () => {
    // Read the account holder from your backend for the outcome.
  },
  onError: ({ code }) => {},
});
```

`getClientToken` is called on mount and on every restart, since each client token is redeemable once. Pass `clientToken` instead when the page cannot create a new session.

## Mount options

| Component | Options |
| --- | --- |
| Card viewer | `container`, `cardToken`, `labels`, `style`, `onReady`, `onError`, `onCopy` |
| Session | `container`, `clientToken` or `getClientToken`, `title`, `locale`, `colorScheme`, `onReady`, `onComplete`, `onCancel`, `onExpire`, `onError` |

`mount` returns `restart()` and `unmount()`. No callback fires after `unmount()`. The exported types, such as `CardViewerMountOptions` and `SessionMountOptions`, describe each option.

## License

MIT
