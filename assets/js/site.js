/* =========================================================================
   site.js — shared chrome for every page: top nav, mobile menu, footer,
   and the "play our song" (Unstoppable) music player.
   Include on every page AFTER data.js.
   ========================================================================= */
(function () {
  "use strict";
  var d = document;
  var page = d.body.getAttribute("data-page") || "home";
  var hasHero = d.body.classList.contains("has-hero");

  var LINKS = [
    { href: "index.html",   key: "home",    label: "Home" },
    { href: "index.html#origins", key: "story", label: "His Story" },
    { href: "family.html",  key: "family",  label: "Family" },
    { href: "gallery.html", key: "gallery", label: "Gallery" },
    { href: "fun.html",     key: "fun",     label: "Ask Munaf" },
    { href: "dad.html",     key: "dad",     label: "Dad's Desk" }
  ];

  /* ---------- Top nav ---------- */
  var nav = d.createElement("header");
  nav.className = "snav" + (hasHero ? " snav--overlay at-top" : "");
  var linksHtml = LINKS.map(function (l) {
    var active = (l.key === page) ? " aria-current=\"page\"" : "";
    return '<a href="' + l.href + '"' + active + '>' + l.label + "</a>";
  }).join("");
  nav.innerHTML =
    '<a class="snav__brand" href="index.html">Dr. Munaf <b>Shamji</b></a>' +
    '<button class="snav__burger" aria-label="Menu" aria-expanded="false">' +
      '<span></span><span></span><span></span></button>' +
    '<nav class="snav__links">' + linksHtml + "</nav>";
  d.body.insertBefore(nav, d.body.firstChild);

  var burger = nav.querySelector(".snav__burger");
  var linksEl = nav.querySelector(".snav__links");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  linksEl.addEventListener("click", function (e) {
    if (e.target.closest("a")) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("scrolled", y > 30);
    if (hasHero) nav.classList.toggle("at-top", y < (window.innerHeight - 90));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Shared footer (if the page didn't supply one) ---------- */
  if (!d.querySelector("footer")) {
    var f = d.createElement("footer");
    f.className = "sfooter";
    f.innerHTML =
      '<div class="wrap">' +
        '<div class="ecg-divider" aria-hidden="true" style="margin-bottom:18px">' +
          '<svg viewBox="0 0 600 46" preserveAspectRatio="xMidYMid meet"><path class="ecg-path" d="M0,23 L220,23 L235,23 L246,8 L258,40 L270,4 L282,34 L294,23 L600,23"/></svg>' +
        "</div>" +
        '<p style="font-family:var(--serif);font-size:1.4rem;color:#fff;margin:0">Happy Father’s Day, Dad.</p>' +
        '<p class="made" style="margin-top:8px">Built with <span style="color:var(--garnet)">❤</span> by Zain &amp; Reza — June 2026.</p>' +
        '<small>munafshamji.com · A private tribute. Every word here is true; he’s just too humble to say so.</small>' +
      "</div>";
    d.body.appendChild(f);
  }

  /* ---------- Shared lightbox + toast (used by main.js on any page) ---------- */
  if (!d.getElementById("lb")) {
    var lb = d.createElement("div");
    lb.className = "lb"; lb.id = "lb"; lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<button class="lb__close" id="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb__nav prev" id="lb-prev" aria-label="Previous">‹</button>' +
      '<div class="lb__stage" id="lb-stage"></div>' +
      '<button class="lb__nav next" id="lb-next" aria-label="Next">›</button>';
    d.body.appendChild(lb);
  }
  if (!d.getElementById("toast")) {
    var toast = d.createElement("div");
    toast.className = "toast"; toast.id = "toast";
    d.body.appendChild(toast);
  }

  /* ---------- "Play our song" music player ---------- */
  var anthem = (window.SITE && window.SITE.anthem) || { title: "Unstoppable", artist: "Sia", youtubeId: "" };
  var music = d.createElement("div");
  music.className = "music";
  music.innerHTML =
    '<button class="music__btn" aria-pressed="false" title="Play our song">' +
      '<span class="music__eq"><i></i><i></i><i></i></span>' +
      '<span class="music__label">Play our song</span>' +
    "</button>";
  d.body.appendChild(music);
  var mbtn = music.querySelector(".music__btn");
  var ytPlayer = null, playing = false, ytReady = false, wantPlay = false;

  function ensureYT(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} cb(); };
    if (!d.getElementById("yt-api")) {
      var s = d.createElement("script");
      s.id = "yt-api"; s.src = "https://www.youtube.com/iframe_api";
      d.head.appendChild(s);
    }
  }
  function buildPlayer() {
    var host = d.createElement("div");
    host.id = "yt-music"; host.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;";
    d.body.appendChild(host);
    ytPlayer = new window.YT.Player("yt-music", {
      videoId: anthem.youtubeId || "",
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: function () { ytReady = true; if (wantPlay) doPlay(); },
        onStateChange: function (e) {
          if (e.data === window.YT.PlayerState.ENDED) { playing = false; sync(); ytPlayer.playVideo(); }
        }
      }
    });
  }
  function doPlay() {
    if (ytPlayer && ytPlayer.playVideo) { try { ytPlayer.setVolume(55); ytPlayer.playVideo(); playing = true; sync(); } catch (e) {} }
  }
  function sync() {
    mbtn.classList.toggle("on", playing);
    mbtn.setAttribute("aria-pressed", playing ? "true" : "false");
    mbtn.querySelector(".music__label").textContent = playing ? (anthem.title + " — " + anthem.artist) : "Play our song";
  }
  mbtn.addEventListener("click", function () {
    if (!anthem.youtubeId) {
      // No in-page audio configured yet — open the song instead.
      window.open("https://www.youtube.com/results?search_query=" +
        encodeURIComponent(anthem.title + " " + anthem.artist), "_blank", "noopener");
      return;
    }
    if (playing) { if (ytPlayer) ytPlayer.pauseVideo(); playing = false; sync(); return; }
    wantPlay = true;
    if (ytReady) { doPlay(); }
    else { ensureYT(function () { if (!ytPlayer) buildPlayer(); else if (ytReady) doPlay(); }); }
  });
})();
