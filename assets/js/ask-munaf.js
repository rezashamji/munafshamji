/* =========================================================================
   ask-munaf.js — the "Ask Munaf" chat. Answers are GENERATED LIVE by the AI
   Worker (open-source Llama, or Claude if configured). Nothing is scripted.
   If the AI isn't connected yet, it says so honestly (warmly).
   ========================================================================= */
(function () {
  "use strict";
  var d = document;
  var log = d.getElementById("ask-log"), form = d.getElementById("ask-form"),
      input = d.getElementById("ask-input"), suggest = d.getElementById("ask-suggest");
  if (!log || !form || !input) return;

  var history = [], busy = false;

  function el(cls, text) { var n = d.createElement("div"); n.className = cls; if (text != null) n.textContent = text; return n; }
  function add(role, text) { var m = el("msg " + (role === "user" ? "user" : "bot"), text); log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
  function typing() { var m = el("msg bot typing"); m.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>'; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }

  add("bot", "You’re here — sit, sit. Tell me what's on your mind. (And first: did you eat something?)");

  var OFFLINE =
    "My full brain isn’t plugged in yet — tell Reza or Zain to flip the switch (it's free, takes a minute). " +
    "But you already know what I'd say: be honest with yourself, try your hardest, take care of the people around you — and call your mother. Now go, do something good with your day. ❤";

  function respond(text) {
    if (busy) return;
    busy = true;
    add("user", text);
    history.push({ role: "user", content: text });
    if (suggest) suggest.style.display = "none";
    var t = typing();
    var minDelay = new Promise(function (r) { setTimeout(r, 500); });

    var p;
    if (window.MunafAI && window.MunafAI.ready) {
      p = window.MunafAI.ask("chat", { messages: history.slice(-10) }).catch(function () { return OFFLINE; });
    } else {
      p = Promise.resolve(OFFLINE);
    }

    Promise.all([p, minDelay]).then(function (v) {
      t.remove();
      var reply = v[0];
      add("bot", reply);
      history.push({ role: "assistant", content: reply });
      busy = false;
    }).catch(function () { t.remove(); add("bot", OFFLINE); busy = false; });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v || busy) return;
    input.value = "";
    respond(v);
  });
  if (suggest) suggest.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return; respond(c.textContent.trim());
  });
})();
