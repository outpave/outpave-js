import { loadEmbedded } from "@outpave/outpave-js";

const form = document.querySelector("#card-form");
const status = document.querySelector("#status");
const embedded = await getEmbedded();
let viewer = null;

form.cardId.value = new URLSearchParams(location.search).get("cardId") ?? "";
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  viewer?.unmount();
  viewer = null;
  if (!embedded) return;

  const cardId = form.cardId.value.trim();
  setStatus(`Requesting a card token for ${cardId}...`);
  const response = await fetch(`/card-token?cardId=${encodeURIComponent(cardId)}`);
  const body = await response.json();
  if (!response.ok) {
    setStatus(`${response.status} ${body.code ?? ""} ${body.detail ?? body.title ?? ""}`.trim(), "error");
    return;
  }

  setStatus("Loading the card...");
  try {
    viewer = embedded.mount({
      container: "#card-details",
      cardToken: body.cardToken,
      onReady: () => setStatus("Card details are showing.", "ok"),
      onError: ({ code }) => setStatus(`${code}: request a new card token and try again.`, "error"),
      onCopy: ({ field }) => setStatus(`Copied ${field}.`, "ok"),
    });
  } catch (error) {
    setStatus(error.message, "error");
  }
});

async function getEmbedded() {
  try {
    const { loaderUrl } = await (await fetch("/config")).json();
    return await loadEmbedded({ loaderUrl });
  } catch (error) {
    setStatus(error.message, "error");
    return null;
  }
}

function setStatus(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}
