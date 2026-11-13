# Card viewer example

Shows a card's details with `@outpave/outpave-js`. A small server exchanges your API key for an access token and reads the card's `cardToken`; the page mounts the card viewer with it. The API key never reaches the browser.

## Run it

1. Install:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill it in:

   | Variable | Value |
   | --- | --- |
   | `API_BASE_URL` | `https://API_HOST/api/v2`, with the API domain assigned to your integration |
   | `API_KEY` | An API key enabled for API v2 with `cards:read`. Its IP allowlist must include this machine. |
   | `ACCOUNT_HOLDER_ID` | The card's account holder ID, for a platform key. Leave empty for a company key. |
   | `LOADER_URL` | `https://APP_HOST/embedded/v1/loader.js`, with the domain of the web app assigned to your integration |
   | `PORT` | Optional. Defaults to `5173`. |

3. Start it and open `http://localhost:5173`:

   ```bash
   npm start
   ```

4. Enter the ID of an `ACTIVE` card and select **Show card**. The status line reports each step, the API's error code if it refuses, or the viewer's `onError` code.

The server listens on `localhost` only. `?cardId=<id>` in the page URL fills in the card ID.
