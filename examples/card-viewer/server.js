import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const { API_BASE_URL, API_KEY, ACCOUNT_HOLDER_ID, LOADER_URL } = process.env;
const PORT = Number(process.env.PORT) || 5173;
const CARD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const API_TIMEOUT_MS = 20_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const JAVASCRIPT = "text/javascript; charset=utf-8";

const FILES = {
  "/": { url: new URL("./index.html", import.meta.url), type: "text/html; charset=utf-8" },
  "/app.js": { url: new URL("./app.js", import.meta.url), type: JAVASCRIPT },
  "/vendor/outpave-js.js": { url: new URL(import.meta.resolve("@outpave/outpave-js")), type: JAVASCRIPT },
};

const missing = Object.entries({ API_BASE_URL, API_KEY, LOADER_URL })
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  console.error(`Set ${missing.join(", ")} in .env (see .env.example).`);
  process.exit(1);
}

let accessToken = null;

createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  try {
    if (url.pathname === "/config") {
      sendJson(response, 200, { loaderUrl: LOADER_URL });
      return;
    }
    if (url.pathname === "/card-token") {
      await sendCardToken(response, url.searchParams.get("cardId"));
      return;
    }
    const file = FILES[url.pathname];
    if (!file) {
      sendJson(response, 404, { detail: "Not found." });
      return;
    }
    response.writeHead(200, { "Content-Type": file.type });
    response.end(await readFile(file.url));
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(response, error.status, error.body);
      return;
    }
    sendJson(response, 502, { detail: error.message });
  }
}).listen(PORT, "localhost", () => {
  console.log(`Card viewer example: http://localhost:${PORT}`);
});

async function sendCardToken(response, cardId) {
  if (!CARD_ID_PATTERN.test(cardId ?? "")) {
    sendJson(response, 400, { detail: "Enter a card ID." });
    return;
  }
  const card = await callApi(`/cards/${encodeURIComponent(cardId)}?extend=cardToken`, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(ACCOUNT_HOLDER_ID && { "Account-Holder": ACCOUNT_HOLDER_ID }),
    },
  });
  if (!card.cardToken) {
    sendJson(response, 502, { detail: "The card response has no cardToken." });
    return;
  }
  sendJson(response, 200, { cardToken: card.cardToken });
}

async function getAccessToken() {
  if (accessToken && accessToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return accessToken.token;
  }
  accessToken = await callApi("/access-token", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return accessToken.token;
}

async function callApi(path, init) {
  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}${path}`, {
    ...init,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, body);
  return body;
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

class ApiError extends Error {
  constructor(status, body) {
    super(`The API answered ${status}.`);
    this.status = status;
    this.body = body;
  }
}
