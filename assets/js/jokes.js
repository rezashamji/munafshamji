/* =========================================================================
   jokes.js — "Ask Munaf for a joke."
   - His REAL jokes (clearly his) are shown as-is.
   - "Fresh one" / "Hype my friend" GENERATE LIVE via the AI Worker.
   - If the AI isn't connected yet, we're honest and show his real ones.
   ========================================================================= */
(function () {
  "use strict";

  // His actual material (lightly tidied from how he tells it). NOT AI-generated.
  var HIS_REAL = [
    "You waited two hours at the doctor? Beta, in my office you wait two minutes — and I still ask about your mother first.",
    "Reza wants to invest his money from his income. Very smart. He just forgot one detail — the income is mine.",
    "Oh, you're Reza's friend? He always talks about you! Honestly… I probably know no more about you than Reza does. Come, eat something."
  ];
  function pickerFor(arr) {
    var bag = [];
    return function () {
      if (!bag.length) { bag = arr.slice(); for (var i = bag.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = bag[i]; bag[i] = bag[j]; bag[j] = t; } }
      return bag.pop();
    };
  }
  var nextReal = pickerFor(HIS_REAL);

  var stage = document.getElementById("joke-text");
  var tag = document.getElementById("joke-tag");
  if (!stage) return;

  var busy = false;
  function setTag(t) { if (tag) tag.textContent = t || ""; }
  function show(text) {
    stage.classList.add("swap");
    setTimeout(function () { stage.textContent = "“" + text + "”"; stage.classList.remove("swap"); }, 320);
  }
  function loading() {
    stage.classList.add("swap");
    setTimeout(function () { stage.textContent = "…thinking of a good one…"; stage.classList.remove("swap"); }, 200);
  }

  function live(mode, opts, realFallbackTag) {
    if (busy) return;
    if (!window.MunafAI || !window.MunafAI.ready) {
      setTag(realFallbackTag + " · (connect the AI for fresh ones)");
      show(nextReal());
      return;
    }
    busy = true; setTag("Munaf is thinking…"); loading();
    window.MunafAI.ask(mode, opts).then(function (reply) {
      setTag(mode === "friend" ? "Meeting your friend" : "Fresh from Munaf");
      show(reply);
    }).catch(function () {
      setTag(realFallbackTag + " · (AI hiccup — here's a real one)");
      show(nextReal());
    }).then(function () { busy = false; });
  }

  var dadBtn = document.getElementById("joke-dad");
  var friendBtn = document.getElementById("joke-friend");
  var realBtn = document.getElementById("joke-real");

  if (dadBtn) dadBtn.addEventListener("click", function () { live("joke", {}, "A Munaf classic"); });
  if (friendBtn) friendBtn.addEventListener("click", function () {
    var name = (document.getElementById("friend-name") || {}).value || "";
    live("friend", { friendName: name.trim() }, "His friend bit");
  });
  if (realBtn) realBtn.addEventListener("click", function () { setTag("In his own words"); show(nextReal()); });

  // start with one of his real ones
  setTag("In his own words"); show(nextReal());
})();
