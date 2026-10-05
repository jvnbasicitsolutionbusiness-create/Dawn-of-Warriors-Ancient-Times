import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("boot loader keeps its progress and crate moving while assets are pending", () => {
  let now = 0;
  const frames = [];
  const elements = new Map();
  for (const id of ["boot-bar", "boot-crate", "boot-pct", "boot-status"]) {
    elements.set(id, {
      style: {},
      textContent: "",
      parentElement: { setAttribute() {} },
    });
  }
  class PendingImage {
    set src(_value) {}
  }
  const context = {
    document: { getElementById: (id) => elements.get(id) },
    performance: { now: () => now },
    Image: PendingImage,
    requestAnimationFrame: (callback) => frames.push(callback),
    setTimeout() {},
    window: { location: { href: "" } },
  };
  runInNewContext(
    readFileSync(new URL("../public/boot/loader.js", import.meta.url), "utf8"),
    context,
  );
  context.window.BootLoader.start({
    assets: ["/slow-historical-image.jpeg"],
    minMs: 6500,
    maxMs: 12000,
    statuses: ["Preparing", "Loading"],
  });

  const progress = [];
  for (now of [0, 1000, 2000, 3000]) {
    frames.shift()();
    progress.push(Number.parseInt(elements.get("boot-pct").textContent, 10));
  }

  assert.ok(progress[1] > progress[0]);
  assert.ok(progress[2] > progress[1]);
  assert.ok(progress[3] > progress[2]);
  assert.ok(elements.get("boot-crate").style.left.includes("%"));
});
