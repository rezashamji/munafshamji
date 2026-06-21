# Ask Munaf — the live AI backend

Powers the **live** jokes + chat on the site. It generates everything on the fly
in Dad's voice. **No API key, no cost** — it runs on **Cloudflare Workers AI**
(free, open-source Llama models) using the Cloudflare account you already have.

## Deploy (≈5 min)

```bash
cd worker
npx wrangler login      # the same Cloudflare account as the domain
npx wrangler deploy     # Workers AI is enabled in wrangler.toml ([ai] binding)
```

Wrangler prints a URL like `https://ask-munaf.<you>.workers.dev`.
Paste it into [`../assets/js/data.js`](../assets/js/data.js):

```js
window.SITE.workerUrl = "https://ask-munaf.<you>.workers.dev";
```

Commit + push — the live AI is on across the whole site.

## What it does
- `mode: "chat"` — the Ask Munaf conversation
- `mode: "joke"` — a brand-new joke in his voice
- `mode: "friend"` — his "oh, they talk about you all the time!" bit
- `mode: "wisdom"` — a line of his fatherly wisdom

Rate-limited (40 / 10 min / visitor) and origin-locked to your domain.

## Optional: use Claude instead of open-source
Better quality, small ongoing cost:
```bash
npx wrangler secret put ANTHROPIC_API_KEY   # paste a key from console.anthropic.com
npx wrangler deploy
```
The Worker auto-detects the key and switches to Claude (`claude-opus-4-8`).

## Change the model or personality
- Open-source model: `CF_MODEL` in `wrangler.toml`
  (e.g. `@cf/meta/llama-3.3-70b-instruct-fp8-fast` for smarter, slower).
- His voice: `PERSONA` in `src/index.js`. Redeploy after edits.
