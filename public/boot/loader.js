/* Dawn of Warriors — boot loader: percentage, moving supply-crate box and
   status lines driven by real asset preloading, with a time floor and cap so
   the screen always completes and redirects.
   DOM contract: #boot-bar (fill span), #boot-crate, #boot-pct, #boot-status.
   Usage: BootLoader.start({ assets, minMs, maxMs, target, statuses, doneStatus }) */
(function () {
  "use strict";

  function start(opts) {
    opts = opts || {};
    var bar = document.getElementById("boot-bar");
    var crate = document.getElementById("boot-crate");
    var pct = document.getElementById("boot-pct");
    var statusEl = document.getElementById("boot-status");
    var assets = opts.assets || [];
    var minMs = opts.minMs || 6000;
    var maxMs = opts.maxMs || 12000;
    var statuses = opts.statuses || ["Initializing game assets..."];
    var started = performance.now();
    var units = assets.length;
    var done = 0;
    var finished = false;
    var lastStatus = -1;

    function unitDone() {
      done = Math.min(units, done + 1);
    }
    assets.forEach(function (url) {
      var img = new Image();
      var counted = false;
      function count() {
        if (counted) return;
        counted = true;
        unitDone();
      }
      img.onload = count;
      img.onerror = count;
      img.src = url;
    });

    function frame() {
      var elapsed = performance.now() - started;
      var assetShare = units ? done / units : 1;
      var timeShare = Math.min(1, elapsed / minMs);
      // Time-based progress keeps the crate moving while large images are still loading.
      var p = Math.min(1, 0.15 * assetShare + 0.85 * timeShare);
      if (elapsed >= maxMs) p = 1;
      var value = Math.floor(p * 100);
      if (bar) bar.style.width = value + "%";
      if (crate) crate.style.left = "calc(" + value + "% - 11px)";
      if (pct) pct.textContent = value + "%";
      if (bar && bar.parentElement)
        bar.parentElement.setAttribute("aria-valuenow", String(value));
      var idx = Math.min(statuses.length - 1, Math.floor(p * statuses.length));
      if (idx !== lastStatus && statusEl) {
        lastStatus = idx;
        statusEl.textContent = statuses[idx];
      }
      var complete = (assetShare >= 1 && elapsed >= minMs) || elapsed >= maxMs;
      if (complete && !finished) {
        finished = true;
        if (bar) bar.style.width = "100%";
        if (crate) crate.style.left = "calc(100% - 11px)";
        if (pct) pct.textContent = "100%";
        if (statusEl)
          statusEl.textContent =
            opts.doneStatus || "Opening the kingdom gate...";
        setTimeout(function () {
          window.location.href = opts.target || "index.html";
        }, 700);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.BootLoader = { start: start };
})();
