# ❤ munafshamji.com — a Father's Day gift for Dad

A private, multi-page website celebrating **Dr. Munaf Abdulrasul Velji Shamji** —
cardiologist, healer, best friend, and the man who never brags about himself.
Built by **Zain & Reza**.

The goal: Dad types **munafshamji.com** on his phone and *everything* is there.
No GitHub, no setup, on his end.

---

## What's in it (pages)

| Page | What it is |
|---|---|
| **Home** (`index.html`) | The story — hero, his life in chapters, the letter, the timeline |
| **Family** (`family.html`) | The whole **family tree** — tap any name to expand; "+ add a relative" to grow it |
| **Gallery** (`gallery.html`) | Every photo & video, in a tap-to-open lightbox |
| **Ask Munaf** (`fun.html`) | **Live AI** jokes in his voice, his "friend of Zain/Reza" bit, and a chat |
| **Dad's Desk** (`dad.html`) | *For Dad:* write a to-do → it texts/emails the family · share an article (snap a photo, it reads the headline) · his favorite songs |
| Everywhere | A "♪ Play our song" (Unstoppable) button, bottom-left |

The AI **generates live** — nothing is pre-written. It runs on **Cloudflare Workers AI**
(open-source Llama), so there's **no API key and no cost** — just your Cloudflare account.

---

## Go live in 4 steps

### 1. Push to GitHub (rezashamji) — *done by setup*
### 2. Turn on GitHub Pages
Repo → **Settings → Pages** → Source: **Deploy from a branch** → **main / (root)** → Save.
A `CNAME` + `.nojekyll` are already included, so it's ready for the custom domain.

### 3. Get the domain `munafshamji.com` (it's available ✅) + point it at Pages
1. <https://dash.cloudflare.com> → **Register Domains** → `munafshamji.com` (~$10/yr).
2. Cloudflare → your domain → **DNS** → add (set each to **DNS only / grey cloud**):

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `rezashamji.github.io` |
3. GitHub **Settings → Pages → Custom domain** → `munafshamji.com` → Save → tick **Enforce HTTPS**.

**That's it — the site is live.** Family tree, Dad's Desk, gallery, songs, music all work now.

### 4. Switch on the live AI (≈5 min, free)
The jokes/chat need the little AI backend running. It uses Cloudflare's free, open-source AI — **no API key.**

```bash
cd worker
npx wrangler login          # same Cloudflare account
npx wrangler deploy         # deploys the Worker (Workers AI is enabled in wrangler.toml)
```
Copy the printed URL (e.g. `https://ask-munaf.<you>.workers.dev`) and paste it into
[`assets/js/data.js`](assets/js/data.js):

```js
window.SITE.workerUrl = "https://ask-munaf.<you>.workers.dev";
```
Commit + push. The AI is now live everywhere. (Until then, jokes show **his real ones** and
Ask Munaf gives an honest "flip the switch" message — never broken.)

> Want *Claude*-quality instead of open-source? In `worker/`, run
> `npx wrangler secret put ANTHROPIC_API_KEY` and redeploy — it'll use Claude automatically.

---

## ✅ Please confirm before you show Dad

I built this from your notes — give these a quick look:

- **Family tree** (`assets/js/data.js`) — I structured your whole family as best I could.
  Confirm spellings/relationships, especially Dad's siblings (**Zazmina**, **Alta**) and a
  couple of "[brother]" placeholders. Anyone can also **+ add** more right on the page.
- **"Play our song"** — to make *Unstoppable* play **inside** the page (not just open YouTube),
  paste its YouTube video id into `assets/js/data.js` → `anthem.youtubeId`.
- **Photo captions** — a few are my best guess (e.g. who's who). Skim `content/media-map.md`.

Tell me any change and I'll fix it.

---

## Editing later

- **Names / family / songs / contacts:** all in [`assets/js/data.js`](assets/js/data.js).
- **Add photos/videos:** drop into `fathers_day_2026_photos_and_vids/`, add a line in
  `scripts/build_media.sh`, run `bash scripts/build_media.sh`, reference the new slug.
- **The AI's personality:** `worker/src/index.js` (`PERSONA`).

Made with love. Happy Father's Day. ❤
