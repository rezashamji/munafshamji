/* =========================================================================
   dadtools.js — Dad's Desk
   1) To-do list  -> opens Messages/Mail pre-filled to the family
   2) NYT article -> reads a photo (in-browser OCR) or a link, shares it
   3) Songs he loves -> Spotify / YouTube links
   No servers, no accounts. Works straight from his phone.
   ========================================================================= */
(function () {
  "use strict";
  var d = document;
  var contacts = (window.SITE && window.SITE.contacts) || [];

  /* ----- shared: who's selected + senders ----- */
  function selected(scope) {
    var picks = [];
    (scope || d).querySelectorAll(".recip input:checked").forEach(function (cb) {
      var c = contacts[+cb.value]; if (c) picks.push(c);
    });
    return picks.length ? picks : contacts; // default: everyone
  }
  function sendSms(body, scope) {
    var nums = selected(scope).map(function (c) { return c.phone; }).join(",");
    // iOS/most: sms:<nums>?&body=<text>
    window.location.href = "sms:" + nums + "?&body=" + encodeURIComponent(body);
  }
  function sendEmail(subject, body, scope) {
    var to = selected(scope).map(function (c) { return c.email; }).join(",");
    window.location.href = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  // render recipient chips into any .recip[data-recip]
  d.querySelectorAll(".recip[data-recip]").forEach(function (box) {
    box.innerHTML = contacts.map(function (c, i) {
      return '<label><input type="checkbox" value="' + i + '" checked> ' + c.name + "</label>";
    }).join("");
  });

  /* ----- 1) To-do list ----- */
  var todo = d.getElementById("todo-text");
  if (todo) {
    var todoScope = todo.closest(".desk-card");
    function todoBody() {
      var items = todo.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (!items.length) return "";
      return "📝 Dad's to-do list:\n\n" + items.map(function (s) { return "• " + s; }).join("\n") + "\n\n— Love, Dad";
    }
    var sMsg = d.getElementById("todo-sms"), sMail = d.getElementById("todo-email");
    if (sMsg) sMsg.addEventListener("click", function () { var b = todoBody(); if (!b) return alert("Write a to-do first, Dad 🙂"); sendSms(b, todoScope); });
    if (sMail) sMail.addEventListener("click", function () { var b = todoBody(); if (!b) return alert("Write a to-do first, Dad 🙂"); sendEmail("Dad's to-do list", b, todoScope); });
  }

  /* ----- 2) NYT article (link or photo OCR) ----- */
  var artScope = d.getElementById("article-card");
  if (artScope) {
    var linkInput = d.getElementById("article-link");
    var drop = d.getElementById("article-drop");
    var fileInput = d.getElementById("article-file");
    var status = d.getElementById("article-status");
    var headline = ""; // read from photo

    function articleBody() {
      var link = (linkInput && linkInput.value.trim()) || "";
      var msg = "📰 Dad says read this:\n\n";
      if (headline) msg += "“" + headline + "”\n";
      if (link) msg += link + "\n";
      else if (headline) msg += "https://www.google.com/search?q=" + encodeURIComponent(headline + " New York Times") + "\n";
      msg += "\n— Dad";
      return (headline || link) ? msg : "";
    }

    function runOCR(file) {
      if (!file) return;
      status.textContent = "Reading the headline from your photo…";
      function go() {
        Tesseract.recognize(file, "eng").then(function (res) {
          var lines = (res.data.text || "").split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 14; });
          lines.sort(function (a, b) { return b.length - a.length; });
          headline = lines[0] || "";
          status.textContent = headline ? "Got it: “" + headline + "”" : "Couldn't read it clearly — try a clearer photo, or paste the link.";
        }).catch(function () { status.textContent = "Couldn't read the photo — paste the link instead."; });
      }
      if (window.Tesseract) go();
      else {
        var s = d.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
        s.onload = go; s.onerror = function () { status.textContent = "Reader unavailable offline — paste the link instead."; };
        d.head.appendChild(s);
      }
    }
    if (drop && fileInput) {
      drop.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () { runOCR(fileInput.files[0]); });
      ["dragover", "dragenter"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("drag"); }); });
      ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("drag"); }); });
      drop.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) runOCR(e.dataTransfer.files[0]); });
    }
    var aMsg = d.getElementById("article-sms"), aMail = d.getElementById("article-email");
    if (aMsg) aMsg.addEventListener("click", function () { var b = articleBody(); if (!b) return alert("Add a link or a photo first 🙂"); sendSms(b, artScope); });
    if (aMail) aMail.addEventListener("click", function () { var b = articleBody(); if (!b) return alert("Add a link or a photo first 🙂"); sendEmail("An article Dad wants you to read", b, artScope); });
  }

  /* ----- 3) Songs ----- */
  var sg = d.getElementById("song-grid");
  if (sg && window.SITE && window.SITE.songs) {
    sg.innerHTML = window.SITE.songs.map(function (s) {
      var q = encodeURIComponent(s.title + " " + s.artist);
      return '<div class="song">' +
        '<div class="song__art">♪</div>' +
        '<div class="song__meta"><b>' + s.title + "</b><span>" + s.artist + (s.note ? " — " + s.note : "") + "</span></div>" +
        '<div class="song__links">' +
          '<a href="https://open.spotify.com/search/' + q + '" target="_blank" rel="noopener">Spotify</a>' +
          '<a href="https://www.youtube.com/results?search_query=' + q + '" target="_blank" rel="noopener">YouTube</a>' +
        "</div></div>";
    }).join("");
  }
})();
