/* =========================================================================
   main.js — interactions for the Munaf tribute
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- FAB show/hide on scroll (nav handled by site.js) ---------- */
  var fab = $("#fab");
  function onScroll() {
    if (!fab) return;
    var y = window.scrollY || window.pageYOffset;
    fab.classList.toggle("show", y > window.innerHeight * 0.9);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  // Immediately reveal anything already in view (no first-paint flash, and a
  // safety net if IntersectionObserver callbacks are delayed).
  function sweepReveals() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-vis");
    });
  }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-vis"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    sweepReveals();
    window.addEventListener("load", sweepReveals);
  } else {
    reveals.forEach(function (el) { el.classList.add("is-vis"); });
  }

  /* ---------- ECG line: measure + draw ---------- */
  $$(".ecg-animate").forEach(function (wrap) {
    var path = $(".ecg-path", wrap);
    if (!path) return;
    try {
      var len = Math.ceil(path.getTotalLength());
      wrap.style.setProperty("--len", len);
    } catch (e) {}
  });
  if ("IntersectionObserver" in window) {
    var ecgIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-vis"); ecgIO.unobserve(e.target); } });
    }, { threshold: 0.4 });
    $$(".ecg-animate").forEach(function (el) { ecgIO.observe(el); });
  } else {
    $$(".ecg-animate").forEach(function (el) { el.classList.add("is-vis"); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var start = null, dur = 1500;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); cIO.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (el) { cIO.observe(el); });
  } else {
    $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ---------- Gallery generation ---------- */
  var GALLERY = [
    { s: "vintage-nap",        t: "img",   c: "A sleeping boy, and the man who never put him down." },
    { s: "vintage-shower",     t: "img",   c: "Soaking wet and both grinning." },
    { s: "vintage-boys-floor", t: "img",   c: "Both boys piled on Dad. Always." },
    { s: "seychelles-swing",  t: "img",   c: "A beach swing in the Seychelles." },
    { s: "morocco-atlas",     t: "img",   c: "Bundled up in the Atlas Mountains, Morocco." },
    { s: "bali-heart",        t: "img",   c: "Framed inside a heart — Bali, with both his boys." },
    { s: "santiago-rock",     t: "img",   c: "On top of the city — Santiago, Chile." },
    { s: "panama-bike",       t: "img",   c: "Snack break, helmet on — Panama." },
    { s: "aga-khan-dinner",   t: "video", c: "Aga Khan Foundation shirt, mid-joke at dinner." },
    { s: "pool-kiss",         t: "img",   c: "A kiss on the cheek in the pool." },
    { s: "laughing-in-bed",   t: "img",   c: "Laughing so hard the photo came out blurry." },
    { s: "reading-harvard",   t: "img",   c: "The morning paper, wherever he is." },
    { s: "plane-sleeping",    t: "img",   c: "The hardest-working nap in economy." },
    { s: "goofy-selfie",      t: "video", c: "Peak goofy. We love this one." },
    { s: "ucla-hug",          t: "img",   c: "UCLA sweater, plaid pajamas, full hug." },
    { s: "stadium-hug",       t: "img",   c: "In the bleachers, arms around his son." },
    { s: "mirror-roses",      t: "img",   c: "Roses on the table, son in the mirror." },
    { s: "pool-table",        t: "img",   c: "Pool night with the boys." },
    { s: "with-mom-couch",    t: "img",   c: "Deep in conversation with his mother." },
    { s: "grandmothers-family", t: "img", c: "Three generations under one roof." },
    { s: "family-restaurant", t: "img",   c: "Dinner with the people he loves." },
    { s: "hotel-family-selfie", t: "img", c: "Family selfie, on the road." },
    { s: "car-selfie",        t: "img",   c: "Hooded and unbothered." },
    { s: "pajamas-pose",      t: "img",   c: "Striking a pose. In pajamas. Naturally." },
    { s: "vintage-captain-hat", t: "img", c: "Young captain, small first mate." }
  ];
  var grid = $("#gallery-grid");
  if (grid) {
    var html = "";
    GALLERY.forEach(function (g) {
      var thumb = g.t === "video" ? "assets/video/" + g.s + "-poster.jpg" : "assets/img/" + g.s + "-thumb.jpg";
      var full  = g.t === "video" ? "assets/video/" + g.s + ".mp4"        : "assets/img/" + g.s + ".jpg";
      html += '<figure class="js-media" data-type="' + g.t + '" data-src="' + full + '" data-cap="' + g.c.replace(/"/g, "&quot;") + '">';
      html += '<img src="' + thumb + '" alt="' + g.c.replace(/"/g, "&quot;") + '" loading="lazy">';
      if (g.t === "video") html += '<span class="vbadge"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
      html += "</figure>";
    });
    grid.innerHTML = html;
  }

  /* ---------- Lightbox ---------- */
  var lb = $("#lb"), stage = $("#lb-stage"), items = [], idx = 0;
  function collect() { items = $$(".js-media"); }
  function render() {
    var el = items[idx];
    if (!el) return;
    var type = el.getAttribute("data-type"), src = el.getAttribute("data-src"), cap = el.getAttribute("data-cap") || "";
    var inner = "";
    if (type === "video") {
      inner = '<video src="' + src + '" controls autoplay playsinline preload="auto"></video>';
    } else {
      inner = '<img src="' + src + '" alt="' + cap.replace(/"/g, "&quot;") + '">';
    }
    if (cap) inner += '<div class="lb__cap">' + cap + "</div>";
    stage.innerHTML = inner;
  }
  function openAt(el) {
    collect();
    idx = items.indexOf(el);
    if (idx < 0) idx = 0;
    render();
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    stage.innerHTML = "";
    document.body.style.overflow = "";
  }
  function go(d) {
    idx = (idx + d + items.length) % items.length;
    render();
  }
  document.addEventListener("click", function (e) {
    var m = e.target.closest(".js-media");
    if (m) { e.preventDefault(); openAt(m); }
  });
  $("#lb-close").addEventListener("click", close);
  $("#lb-prev").addEventListener("click", function () { go(-1); });
  $("#lb-next").addEventListener("click", function () { go(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });

  /* ---------- Munaf-ism: live AI wisdom (real quote as honest fallback) ---------- */
  var REAL_ISMS = [
    "It doesn't matter how well you do it. It matters that you tried.", // the rule he raised us on
    "Be honest with yourself first. Everything else gets easier.",
    "Family isn't something you have. It's something you build — over and over."
  ];
  var ismBtn = $("#munafism-btn"), ismOut = $("#munafism-out"), lastIsm = -1, ismBusy = false;
  function showIsm(text) {
    ismOut.style.opacity = 0;
    setTimeout(function () { ismOut.textContent = "“" + text + "”"; ismOut.style.transition = "opacity .5s"; ismOut.style.opacity = 1; }, 160);
  }
  function realIsm() { var i; do { i = Math.floor(Math.random() * REAL_ISMS.length); } while (i === lastIsm && REAL_ISMS.length > 1); lastIsm = i; return REAL_ISMS[i]; }
  if (ismBtn && ismOut) {
    ismBtn.addEventListener("click", function () {
      if (ismBusy) return;
      if (window.MunafAI && window.MunafAI.ready) {
        ismBusy = true; showIsm("…");
        window.MunafAI.ask("wisdom", {}).then(showIsm).catch(function () { showIsm(realIsm()); }).then(function () { ismBusy = false; });
      } else {
        showIsm(realIsm());
      }
    });
  }

  /* ---------- FAB -> Ask Munaf (scroll if on-page, else go to fun.html) ---------- */
  if (fab) fab.addEventListener("click", function () {
    var ask = $("#ask");
    if (ask) { ask.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { var inp = $("#ask-input"); if (inp) inp.focus(); }, reduce ? 0 : 700); }
    else { window.location.href = "fun.html"; }
  });

  /* ---------- Toast helper ---------- */
  var toastEl = $("#toast"), toastTimer;
  window.showToast = function (msg, ms) {
    toastEl.innerHTML = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 4200);
  };

  /* ---------- Heart confetti ---------- */
  window.heartBurst = function (n) {
    if (reduce) return;
    n = n || 28;
    for (var k = 0; k < n; k++) {
      (function (k) {
        var h = document.createElement("div");
        h.className = "heart-burst";
        h.textContent = ["❤", "🧡", "💛", "❤️"][k % 4];
        var startX = Math.random() * window.innerWidth;
        h.style.left = startX + "px";
        h.style.top = "-40px";
        h.style.fontSize = (16 + Math.random() * 22) + "px";
        document.body.appendChild(h);
        var dur = 2400 + Math.random() * 2200;
        var drift = (Math.random() - 0.5) * 240;
        var rot = (Math.random() - 0.5) * 540;
        var start = performance.now();
        function fall(t) {
          var p = Math.min((t - start) / dur, 1);
          h.style.transform = "translate(" + (drift * p) + "px," + (window.innerHeight + 80) * p + "px) rotate(" + (rot * p) + "deg)";
          h.style.opacity = String(1 - p * p);
          if (p < 1) requestAnimationFrame(fall); else h.remove();
        }
        setTimeout(function () { requestAnimationFrame(fall); }, k * 45);
      })(k);
    }
  };

  /* ---------- Easter eggs ---------- */
  // Footer heart / heading
  var fh = $("#footer h2");
  if (fh) fh.addEventListener("click", function () { window.heartBurst(20); window.showToast("We love you, Dad. <b>❤</b>"); });

  // Triple-click the brand
  var brand = $(".nav__brand"), clicks = 0, ctimer;
  if (brand) brand.addEventListener("click", function () {
    clicks++; clearTimeout(ctimer);
    ctimer = setTimeout(function () { clicks = 0; }, 600);
    if (clicks >= 3) { clicks = 0; window.heartBurst(24); window.showToast("You really are his kid. <b>Always trying.</b> 😉"); }
  });

  // Konami code
  var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  var pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[pos]) {
      pos++;
      if (pos === seq.length) { pos = 0; window.heartBurst(60); window.showToast("⚽ <b>GOAL.</b> You found Dad's secret. He'd high-five you and pretend it was nothing."); }
    } else {
      pos = (k === seq[0]) ? 1 : 0;
    }
  });

  // A little message for whoever opens the console
  try {
    console.log("%c❤ For Dad.", "color:#9E2B25;font-size:22px;font-weight:700;font-family:Georgia,serif");
    console.log("%cBuilt by his sons. If you're reading this, you're as curious as he is.", "color:#BD8A24;font-size:13px");
  } catch (e) {}
})();
