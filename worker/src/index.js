/**
 * Ask Munaf — Cloudflare Worker (the live AI brain)
 * --------------------------------------------------
 * Generates everything LIVE — nothing is pre-written.
 *   • DEFAULT: Cloudflare Workers AI (open-source Llama). No API key needed,
 *     just your Cloudflare account. Bound as `env.AI` (see wrangler.toml).
 *   • OPTIONAL upgrade: set the ANTHROPIC_API_KEY secret to use Claude instead.
 *
 * Request body: { mode: "chat"|"joke"|"friend"|"wisdom", messages?: [...], friendName?: "" }
 * Response:     { reply: "..." }
 *
 * Deploy: see worker/README.md
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const PERSONA = `You ARE "Munaf" — a warm, funny, humble AI of Dr. Munaf A. Shamji, made by his sons Zain and Reza as a Father's Day gift. You are not the real Munaf and never claim to be; you talk the way he would.

WHO HE IS: an interventional cardiologist in Los Angeles for 25+ years who never brags. Every year he flies to Dar es Salaam, Tanzania with the Aga Khan Health Board — sometimes the only cardiologist in the country — even carrying echo machines in his luggage. He's the heart of a huge family: brings cousins/aunts/uncles together, opens his home to everyone, quietly pays for everyone's dinner, throws a 200–300 person reunion in Newport Beach. Devoted Ismaili Muslim. Adores his wife Tasnim; tenderly cares for his elderly mother Mumtaz; best friend to Zain and Reza.

HIS VALUES: humility above all; "it doesn't matter how well you do it, it matters that you tried"; generosity as a reflex; joy on purpose (laughs hard, plays soccer and volleyball).

HIS LITTLE THINGS (use naturally, don't force): the New York Times each morning, chai with chai toast, Cadbury Whole Nut chocolate, clean vanilla soft serve (Scoopy's in Dar es Salaam), his mom's Indian food, working out with his son.

VOICE: warm, gentle, a little funny and corny like a loving immigrant dad. Do NOT use the word "beta" or other pet names — he does not talk that way. SHORT — 1 to 4 sentences. Lead with care. Deflect praise about himself. Keep it wholesome and family-friendly. Respond ONLY as him in plain text — no stage directions, no meta-commentary, no analysis.`;

// his real jokes — used as STYLE EXAMPLES so the model captures his humor
const JOKE_EXAMPLES = [
  "My patients get upset that they had to wait for me. I tell them — would you really want to go to a doctor whose waiting room is empty?",
  "Reza wants to invest his income. Very ambitious. He just forgot one detail — the income is mine."
];

function modePrompt(mode, body) {
  if (mode === "joke") {
    return {
      system: PERSONA + "\n\nHere are examples of his real jokes (for style only, do NOT repeat them):\n- " +
        JOKE_EXAMPLES.join("\n- "),
      user: "Tell me ONE brand-new short joke in your own voice — doctor humor, family/money humor, chai/Cadbury, or gentle self-deprecation. One or two sentences. Just the joke, no preamble."
    };
  }
  if (mode === "friend") {
    var who = (body && body.friendName ? (" Their name is " + String(body.friendName).slice(0, 40) + ".") : "");
    return {
      system: PERSONA,
      user: "Do your classic bit: a friend of Zain or Reza has just walked in." + who +
        " Warmly insist you've heard SO much about them and that you basically know them better than your own son — then comedically admit you can't quite remember the details, and immediately offer them food. 1 to 3 sentences, just the line."
    };
  }
  if (mode === "wisdom") {
    return {
      system: PERSONA,
      user: "Share one short piece of fatherly wisdom in your voice — about effort, honesty, family, or taking care of your heart. One or two sentences. Just the wisdom, no preamble."
    };
  }
  return { system: PERSONA, user: null }; // chat
}

function corsHeaders(origin, allowed) {
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "Content-Type": "application/json", ...(headers || {}) } });
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
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw.slice(-12)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    let c = typeof m.content === "string" ? m.content.slice(0, 600).trim() : "";
    if (c) out.push({ role: m.role, content: c });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

async function viaClaude(env, system, messages) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || "claude-opus-4-8", max_tokens: 350, system, messages }),
  });
  if (!res.ok) throw new Error("anthropic " + res.status);
  const data = await res.json();
  if (data.stop_reason === "refusal") return "Let’s keep it kind. Tell me what’s really on your mind.";
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}
async function viaWorkersAI(env, system, messages) {
  const model = env.CF_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  const out = await env.AI.run(model, {
    messages: [{ role: "system", content: system }, ...messages],
    max_tokens: 320,
    temperature: 0.85,
  });
  return (out && (out.response || out.result || "")).toString().trim();
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS ||
      "https://munafshamji.com,https://www.munafshamji.com,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8123")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const cors = corsHeaders(request.headers.get("Origin") || "", allowed);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    const hasClaude = !!env.ANTHROPIC_API_KEY;
    const hasWAI = !!env.AI;
    if (!hasClaude && !hasWAI) {
      return json({ error: "No AI configured. Add the [ai] binding (Workers AI) or the ANTHROPIC_API_KEY secret." }, 500, cors);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (rateLimited(ip, 40, 10 * 60 * 1000)) {
      return json({ reply: "Slow down a moment — even I need a chai break. Try again in a few minutes. ❤" }, 429, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, cors); }

    const mode = (body && body.mode) || "chat";
    const mp = modePrompt(mode, body);
    let messages;
    if (mode === "chat") {
      messages = sanitizeMessages(body && body.messages);
      if (!messages.length) return json({ error: "No messages" }, 400, cors);
    } else {
      messages = [{ role: "user", content: mp.user }];
    }

    try {
      const reply = hasClaude ? await viaClaude(env, mp.system, messages)
                              : await viaWorkersAI(env, mp.system, messages);
      return json({ reply: reply || "I’m here. Tell me more." }, 200, cors);
    } catch (err) {
      console.error("AI error", err && err.message);
      return json({ reply: "Sorry, I lost my train of thought for a second — ask me again?" }, 502, cors);
    }
  },
};
