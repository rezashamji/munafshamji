/* =========================================================================
   ai.js — tiny shared client for the live AI Worker.
   window.MunafAI.ask(mode, opts) -> Promise<string>
   modes: "chat" (opts.messages), "joke", "friend" (opts.friendName), "wisdom"
   If no Worker URL is configured, .ready is false and .ask() rejects.
   ========================================================================= */
(function () {
  "use strict";
  var url = (window.SITE && window.SITE.workerUrl) || "";

  window.MunafAI = {
    ready: !!url,
    ask: function (mode, opts) {
      opts = opts || {};
      if (!url) return Promise.reject(new Error("ai-not-configured"));
      var payload = { mode: mode || "chat" };
      if (opts.messages) payload.messages = opts.messages;
      if (opts.friendName) payload.friendName = opts.friendName;
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok && res.status !== 429) throw new Error("worker " + res.status);
        return res.json();
      }).then(function (data) {
        if (!data || !data.reply) throw new Error("no-reply");
        return String(data.reply);
      });
    }
  };
})();
