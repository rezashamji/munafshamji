/**
 * Cloudflare Pages — advanced-mode worker (_worker.js).
 * Serves the static site AND the live AI at /api/ask (same origin).
 * AI = Cloudflare Workers AI (open-source Llama, free, no key) via env.AI,
 *      or Claude if env.ANTHROPIC_API_KEY is set.
 * The [ai] binding + CF_MODEL come from the root wrangler.toml.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const PERSONA = `You ARE "Munaf" — a warm, funny, humble AI of Dr. Munaf A. Shamji, made by his sons Zain and Reza as a Father's Day gift. You are not the real Munaf and never claim to be; you talk the way he would.

WHO HE IS: an interventional cardiologist in Los Angeles for 30+ years who never brags. He flies to heal people across continents — Tanzania (Dar es Salaam, with the Aga Khan Health Board, sometimes the only cardiologist in the country, even carrying echo machines in his luggage), Panama, Pakistan, Tajikistan, Turkey. He's the heart of a huge family: brings cousins/aunts/uncles together, opens his home to everyone, quietly pays for everyone's dinner, throws a 350+ person reunion in Newport Beach. Devoted Ismaili Muslim. Adores his wife Tasnim; tenderly cares for his elderly mother Mumtaz; best friend to his sons Zain and Reza.

HIS VALUES: humility above all; "it doesn't matter how well you do it, it matters that you tried"; do things with intention; be satisfied, but satisfied with intention; there's no point unless you're doing it for others; generosity as a reflex; joy on purpose.

HIS LITTLE THINGS (use naturally, don't force): the New York Times each morning, chai with chai toast, Cadbury Whole Nut chocolate, clean vanilla soft serve (Snoopy's in Dar es Salaam), his mom's Indian food, working out with his son.

VOICE: warm, gentle, a little funny and corny like a loving immigrant dad. Do NOT use the word "beta" or other pet names — he does not talk that way. SHORT — 1 to 4 sentences. Lead with care. Deflect praise about himself. Keep it wholesome and family-friendly. Respond ONLY as him in plain text — no stage directions, no meta-commentary, no analysis.`;

const JOKE_EXAMPLES = [
  "My patients get upset that they had to wait for me. I tell them — would you really want to go to a doctor whose waiting room is empty?",
  "Reza wants to invest his income. Very ambitious. He just forgot one detail — the income is mine."
];

function modePrompt(mode, body) {
  if (mode === "joke") return {
    system: PERSONA + "\n\nHis real jokes (style only, do NOT repeat them):\n- " + JOKE_EXAMPLES.join("\n- "),
    user: "Tell me ONE brand-new short joke in your own voice — doctor humor, family/money humor, chai/Cadbury, or gentle self-deprecation. One or two sentences. Just the joke, no preamble."
  };
  if (mode === "friend") {
    var who = (body && body.friendName ? (" Their name is " + String(body.friendName).slice(0, 40) + ".") : "");
    return { system: PERSONA, user: "Do your classic bit: a friend of Zain or Reza just walked in." + who +
      " Warmly insist you've heard SO much about them and basically know them better than your own son — then comedically admit you can't remember the details, and offer them food. 1 to 3 sentences, just the line." };
  }
  if (mode === "wisdom") return { system: PERSONA,
    user: "Share one short piece of fatherly wisdom in your voice — about effort, honesty, intention, family, or taking care of your heart. One or two sentences. Just the wisdom." };
  return { system: PERSONA, user: null };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

const BUCKET = new Map();
function rateLimited(ip, limit, windowMs) {
  const now = Date.now();
  let b = BUCKET.get(ip);
  if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + windowMs }; BUCKET.set(ip, b); }
  b.count++;
  if (BUCKET.size > 5000) for (const [k, v] of BUCKET) if (now > v.resetAt) BUCKET.delete(k);
  return b.count > limit;
}
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw.slice(-12)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const c = typeof m.content === "string" ? m.content.slice(0, 600).trim() : "";
    if (c) out.push({ role: m.role, content: c });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

async function viaClaude(env, system, messages) {
  const res = await fetch(ANTHROPIC_URL, { method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || "claude-opus-4-8", max_tokens: 350, system, messages }) });
  if (!res.ok) throw new Error("anthropic " + res.status);
  const data = await res.json();
  if (data.stop_reason === "refusal") return "Let’s keep it kind. Tell me what’s really on your mind.";
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}
async function viaWorkersAI(env, system, messages) {
  const out = await env.AI.run(env.CF_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    { messages: [{ role: "system", content: system }, ...messages], max_tokens: 320, temperature: 0.85 });
  return (out && (out.response || out.result || "")).toString().trim();
}

async function handleAsk(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (rateLimited(ip, 40, 10 * 60 * 1000))
    return json({ reply: "Slow down a moment — even I need a chai break. Try again in a few minutes. ❤" }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const mode = (body && body.mode) || "chat";
  const mp = modePrompt(mode, body);
  let messages;
  if (mode === "chat") { messages = sanitize(body && body.messages); if (!messages.length) return json({ error: "No messages" }, 400); }
  else { messages = [{ role: "user", content: mp.user }]; }

  try {
    const reply = env.ANTHROPIC_API_KEY ? await viaClaude(env, mp.system, messages)
                                        : await viaWorkersAI(env, mp.system, messages);
    return json({ reply: reply || "I’m here. Tell me more." });
  } catch (err) {
    return json({ reply: "Sorry, I lost my train of thought for a second — ask me again?" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ask") {
      if (request.method === "OPTIONS") return json({}, 204);
      if (request.method === "POST") return handleAsk(request, env);
      return json({ error: "POST only" }, 405);
    }
    return env.ASSETS.fetch(request); // serve the static site
  }
};
