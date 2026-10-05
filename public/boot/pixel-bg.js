/* Dawn of Warriors — pixelated 2D historical backgrounds for boot screens.
   Draws a low-res scene on a canvas; CSS scales it up with
   image-rendering: pixelated. Usage:
   <canvas id="pixel-bg" data-scene="dawn-forest|dusk-camp"></canvas> */
(function () {
  "use strict";
  var W = 192,
    H = 108;

  function mulberry(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var SCENES = {
    "bronze-age": {
      sky: ["#1a263e", "#394259", "#74605c", "#b67d5b", "#e4b174"],
      sun: { x: 147, y: 59, r: 7, color: "#ffdc91" },
      far: "#34364b",
      mid: "#273a36",
      near: "#17251e",
      ground: "#26301f",
      monuments: ["ziggurat", "pyramid"],
      torches: false,
      birds: true,
    },
    "roman-age": {
      sky: ["#15223c", "#313d5b", "#795452", "#bc7250", "#e8a765"],
      sun: { x: 44, y: 60, r: 6, color: "#ffce81" },
      far: "#39344a",
      mid: "#27342f",
      near: "#16221d",
      ground: "#26301e",
      monuments: ["colosseum"],
      torches: true,
      birds: true,
    },
    "dawn-forest": {
      sky: ["#1b2a4a", "#3c4a6b", "#7a5a63", "#c98a5e", "#e8b06b"],
      sun: { x: 148, y: 62, r: 7, color: "#ffd98a" },
      far: "#2c3550",
      mid: "#22303f",
      near: "#15221c",
      ground: "#1d2a1e",
      monuments: ["pyramid", "ziggurat", "parthenon"],
      torches: false,
      birds: true,
    },
    "dusk-camp": {
      sky: ["#120f26", "#2a1b3d", "#54284a", "#8a4048", "#c76b4a"],
      sun: { x: 40, y: 70, r: 6, color: "#ff9d6b" },
      far: "#241d3a",
      mid: "#1c1830",
      near: "#120f1e",
      ground: "#181420",
      monuments: ["castle", "dome", "pagoda", "colosseum"],
      torches: true,
      birds: false,
    },
  };

  function ditherRow(ctx, y, c1, c2) {
    for (var x = 0; x < W; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  function monument(ctx, kind, x, base, color) {
    ctx.fillStyle = color;
    var i, w, h;
    if (kind === "pyramid") {
      w = 34;
      h = 20;
      for (i = 0; i < h; i++) {
        var half = Math.round((w / 2) * (1 - i / h));
        ctx.fillRect(x - half, base - i - 1, half * 2, 1);
      }
    } else if (kind === "ziggurat") {
      var tiers = [
        [30, 6],
        [22, 6],
        [14, 6],
        [7, 5],
      ];
      var y = base;
      for (i = 0; i < tiers.length; i++) {
        y -= tiers[i][1];
        ctx.fillRect(x - tiers[i][0] / 2, y, tiers[i][0], tiers[i][1]);
      }
    } else if (kind === "parthenon") {
      w = 30;
      h = 14;
      ctx.fillRect(x - w / 2, base - h, w, 2);
      for (i = 0; i < 7; i++)
        ctx.fillRect(x - w / 2 + 2 + i * 4, base - h + 2, 2, h - 4);
      ctx.fillRect(x - w / 2, base - 2, w, 2);
      for (i = 0; i < w / 2; i++)
        (ctx.fillRect(
          x - i,
          base - h - 1 - Math.round((i * 5) / (w / 2)),
          i ? 2 : 1,
          1,
        ),
          ctx.fillRect(
            x + i,
            base - h - 1 - Math.round((i * 5) / (w / 2)),
            i ? 2 : 1,
            1,
          ));
    } else if (kind === "colosseum") {
      w = 36;
      h = 16;
      ctx.fillRect(x - w / 2, base - h, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      for (var r = 0; r < 2; r++)
        for (i = 0; i < 8; i++)
          ctx.fillRect(x - w / 2 + 3 + i * 4, base - h + 3 + r * 6, 2, 3);
      ctx.fillRect(x - w / 2 + w - 6, base - h, 6, 5);
    } else if (kind === "dome") {
      w = 22;
      h = 12;
      ctx.fillRect(x - w / 2, base - h, w, h);
      for (i = 0; i < 8; i++) {
        var half2 = Math.round(
          (w / 2) * Math.sin(((i / 8) * Math.PI) / 2 + Math.PI / 4),
        );
        ctx.fillRect(x - half2, base - h - i - 1, half2 * 2, 1);
      }
      ctx.fillRect(x - 1, base - h - 12, 2, 5);
    } else if (kind === "pagoda") {
      var roofs = [
        [26, 10],
        [20, 7],
        [14, 4],
      ];
      var y2 = base;
      for (i = 0; i < roofs.length; i++) {
        y2 -= 6;
        ctx.fillRect(x - roofs[i][0] / 2, y2, roofs[i][0], 2);
        ctx.fillRect(x - roofs[i][0] / 2 + 3, y2 - 4, roofs[i][0] - 6, 4);
        y2 -= 0;
      }
      ctx.fillRect(x - 1, y2 - 5, 2, 5);
    } else if (kind === "castle") {
      w = 30;
      h = 18;
      ctx.fillRect(x - w / 2, base - h, w, h);
      ctx.fillRect(x - w / 2 - 4, base - h - 6, 7, h + 6);
      ctx.fillRect(x + w / 2 - 3, base - h - 6, 7, h + 6);
      for (i = 0; i < 4; i++) {
        ctx.fillRect(x - w / 2 - 4 + i * 2, base - h - 8, 1, 2);
        ctx.fillRect(x + w / 2 - 3 + i * 2, base - h - 8, 1, 2);
        ctx.fillRect(x - w / 2 + i * 8, base - h - 2, 2, 2);
      }
    }
  }

  function tree(ctx, x, base, color, tall) {
    ctx.fillStyle = color;
    ctx.fillRect(x, base - tall, 1, tall);
    for (var i = 0; i < 4; i++) {
      var half = 3 - i;
      ctx.fillRect(x - half, base - tall - i * 2, half * 2 + 1, 2);
    }
  }

  function draw(ctx, scene, t) {
    var rnd = mulberry(97);
    var bandH = Math.ceil(70 / scene.sky.length);
    for (var b = 0; b < scene.sky.length; b++) {
      var y0 = b * bandH;
      ctx.fillStyle = scene.sky[b];
      ctx.fillRect(0, y0, W, bandH + 1);
      if (b < scene.sky.length - 1)
        ditherRow(ctx, y0 + bandH, scene.sky[b], scene.sky[b + 1]);
    }
    // sun / moon
    var s = scene.sun;
    ctx.fillStyle = s.color;
    for (var dy = -s.r; dy <= s.r; dy++)
      for (var dx = -s.r; dx <= s.r; dx++)
        if (dx * dx + dy * dy <= s.r * s.r)
          ctx.fillRect(s.x + dx, s.y + dy, 1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(s.x - 1, s.y - s.r - 2, 2, 1);
    ctx.fillRect(s.x - 1, s.y + s.r + 1, 2, 1);
    // clouds (drift)
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (var c = 0; c < 3; c++) {
      var cx = Math.floor((rnd() * W + t * (0.6 + c * 0.3)) % (W + 24)) - 12;
      var cy = 8 + Math.floor(rnd() * 22);
      ctx.fillRect(cx, cy, 16, 2);
      ctx.fillRect(cx + 3, cy - 1, 9, 1);
      ctx.fillRect(cx + 2, cy + 2, 12, 1);
    }
    // birds
    if (scene.birds) {
      ctx.fillStyle = "rgba(20,20,30,0.8)";
      for (var bi = 0; bi < 3; bi++) {
        var bx = Math.floor((30 + bi * 40 + t * 1.4) % (W + 10)) - 5;
        var by = 18 + bi * 6 + Math.floor(Math.sin(t * 0.2 + bi) * 1);
        ctx.fillRect(bx, by, 1, 1);
        ctx.fillRect(bx + 2, by, 1, 1);
        ctx.fillRect(bx + 1, by + 1, 1, 1);
      }
    }
    // monument skyline on the far ridge
    var baseFar = 74;
    ctx.fillStyle = scene.far;
    ctx.fillRect(0, baseFar, W, H - baseFar);
    for (var mx = 0; mx < W; mx += 1) {
      var ridge =
        baseFar - Math.round(2 + Math.sin(mx / 21) * 2 + Math.sin(mx / 7) * 1);
      ctx.fillRect(mx, ridge, 1, baseFar - ridge);
    }
    var kinds = scene.monuments;
    for (var m = 0; m < kinds.length; m++)
      monument(
        ctx,
        kinds[m],
        26 + m * Math.floor(150 / kinds.length) + (m % 2) * 9,
        baseFar + 1,
        scene.far,
      );
    // mid hills + tree line
    var baseMid = 88;
    ctx.fillStyle = scene.mid;
    for (var mx2 = 0; mx2 < W; mx2++) {
      var r2 = baseMid - Math.round(3 + Math.sin(mx2 / 13 + 2) * 3);
      ctx.fillRect(mx2, r2, 1, baseMid - r2);
    }
    ctx.fillRect(0, baseMid, W, H - baseMid);
    for (var tr = 0; tr < 26; tr++)
      tree(
        ctx,
        Math.floor(rnd() * W),
        baseMid + 1,
        scene.mid,
        5 + Math.floor(rnd() * 4),
      );
    // near ground + big trees
    var baseNear = 98;
    ctx.fillStyle = scene.near;
    ctx.fillRect(0, baseNear, W, H - baseNear);
    for (var tr2 = 0; tr2 < 10; tr2++)
      tree(
        ctx,
        Math.floor(rnd() * W),
        baseNear + 2,
        scene.near,
        8 + Math.floor(rnd() * 6),
      );
    // ground dither
    for (var gy = baseNear; gy < H; gy += 2)
      ditherRow(ctx, gy, scene.ground, scene.near);
    // torches
    if (scene.torches) {
      var spots = [
        [52, 96],
        [120, 99],
        [164, 95],
      ];
      for (var ti = 0; ti < spots.length; ti++) {
        var tx = spots[ti][0],
          ty = spots[ti][1];
        ctx.fillStyle = "#3a2a1c";
        ctx.fillRect(tx, ty - 6, 1, 6);
        var flick = Math.floor(rnd() * 3 + Math.sin(t * 2 + ti) + 2);
        ctx.fillStyle = "#ff9d3c";
        ctx.fillRect(tx - 1, ty - 8, 3, 2);
        ctx.fillStyle = "#ffd98a";
        ctx.fillRect(tx, ty - 9 - (flick % 2), 1, 2);
        ctx.fillStyle = "rgba(255,157,60,0.18)";
        ctx.fillRect(tx - 4, ty - 12, 9, 8);
      }
    }
  }

  function init() {
    var canvas = document.getElementById("pixel-bg");
    if (!canvas || !canvas.getContext) return;
    var scene =
      SCENES[canvas.getAttribute("data-scene")] || SCENES["dawn-forest"];
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext("2d");
    var last = 0;
    function loop(now) {
      if (now - last > 90) {
        last = now;
        draw(ctx, scene, now / 1000);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
