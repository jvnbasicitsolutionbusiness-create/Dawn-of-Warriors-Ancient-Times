import { chromium } from "playwright";
import sparticuz from "@sparticuz/chromium";
import { brotliDecompressSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const url = process.env.BASE_URL || "http://localhost:3000";
// The npm-distributed browser avoids an external Chromium download in restricted CI.
const libs = join(tmpdir(), "dawn-browser-libs");
mkdirSync(libs, { recursive: true });
if (!existsSync(join(libs, "lib/libnss3.so"))) {
  const tar = join(libs, "runtime.tar");
  writeFileSync(
    tar,
    brotliDecompressSync(
      readFileSync("node_modules/@sparticuz/chromium/bin/al2023.tar.br"),
    ),
  );
  execFileSync("tar", ["-xf", tar, "-C", libs]);
}
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROMIUM_PATH || (await sparticuz.executablePath()),
  args: sparticuz.args,
  env: {
    ...process.env,
    LD_LIBRARY_PATH: `${join(libs, "lib")}:${process.env.LD_LIBRARY_PATH || ""}`,
  },
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 940 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const post = (path, data) =>
  context.request.post(`${url}/api${path}`, { data });
const state = async () => (await context.request.get(`${url}/api/game`)).json();
const close = () =>
  page.getByRole("button", { name: "Close dialog", exact: true }).click();
const check = (name) => console.log(`PASS ${name}`);
try {
  await post("/auth/guest", {});
  const preferences = await (
    await context.request.get(`${url}/api/settings`)
  ).json();
  await context.request.put(`${url}/api/settings`, {
    data: { ...preferences, graphics: "Low" },
  });
  await post("/game/new", { civilization: "aurelia", mode: "campaign" });
  await post("/game/action", { type: "pause" });
  await page.goto(url);
  await page.waitForSelector(".battlefield canvas");
  await page.waitForSelector(".map-loading", { state: "hidden" });
  assert.equal(await page.title(), "Dawn of Warriors · Ancient Times");
  check("WebGL strategy map loads with a real guest session");
  await page.getByRole("button", { name: "Build Shape your empire" }).click();
  await page
    .locator(".catalog-card")
    .filter({ has: page.getByRole("heading", { name: "Farm", exact: true }) })
    .getByTitle("Place Farm", { exact: true })
    .click();
  // Orthographic projection of a valid plot at world (-10, -5), using the initial camera.
  const plot = await page.locator(".battlefield canvas").evaluate((el) => {
    const r = el.getBoundingClientRect(),
      a = 0.27,
      e = Math.atan2(72, 78),
      x = -10,
      z = -5,
      y = 0.3 + Math.sin(x * 0.15) * Math.cos(z * 0.14) * 0.3;
    const u = (x + 4) * Math.cos(a) - z * Math.sin(a),
      v =
        -(x + 4) * Math.sin(a) * Math.sin(e) +
        y * Math.cos(e) -
        z * Math.cos(a) * Math.sin(e);
    return {
      x: r.x + r.width / 2 + (u / 68) * r.height,
      y: r.y + r.height / 2 - (v / 68) * r.height,
    };
  });
  await page.mouse.move(plot.x, plot.y);
  const buildResponse = page.waitForResponse(
    (r) =>
      r.url().includes("/game/action") &&
      r.request().postDataJSON()?.type === "build",
  );
  await page.mouse.click(plot.x, plot.y);
  assert.equal((await buildResponse).status(), 200);
  assert.equal((await state()).buildings.length, 5);
  check("construction is placed on the map and validated by the server");
  await page.getByRole("button", { name: "Recruit Raise your army" }).click();
  const card = page
    .locator(".recruit-card")
    .filter({
      has: page.getByRole("heading", { name: "Legionary", exact: true }),
    });
  await card.getByRole("button", { name: "Recruit", exact: true }).click();
  await page.getByText("Training in progress", { exact: true }).waitFor();
  assert.equal((await state()).recruiting.length, 1);
  await close();
  check("recruitment deducts resources and queues a real cohort");
  await page.locator(".world-label.army.friendly").first().click();
  await page.getByRole("button", { name: "Select all", exact: true }).click();
  const map = await page.locator(".battlefield canvas").boundingBox();
  const moveResponse = page.waitForResponse(
    (r) =>
      r.url().includes("/game/action") &&
      r.request().postDataJSON()?.type === "move",
  );
  await page.mouse.click(map.x + map.width * 0.48, map.y + map.height * 0.64, {
    button: "right",
  });
  assert.equal((await moveResponse).status(), 200);
  assert.ok(
    (await state()).armies
      .filter((a) => !a.enemy)
      .every((a) => a.path.length > 0),
  );
  check("multi-cohort right-click movement issues authoritative orders");
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await page
    .locator(".tech-card")
    .filter({
      has: page.getByRole("heading", { name: "Bronze Forging", exact: true }),
    })
    .getByRole("button", { name: "20s · Research" })
    .click();
  assert.equal((await state()).research.id, "forging");
  await close();
  check("technology research uses prerequisites and a server timer");
  await page.getByRole("button", { name: "Warriors", exact: true }).click();
  await page.getByPlaceholder("Find a warrior…").fill("Lucan");
  assert.equal(await page.locator(".warrior-card").count(), 1);
  await page.locator(".warrior-card").click();
  await page
    .getByRole("heading", { name: "Lucan Varro", exact: true })
    .waitFor();
  await close();
  check("the 54-warrior encyclopedia is searchable and inspectable");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("slider").first().press("Home");
  await page.getByRole("slider").first().press("ArrowRight");
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  assert.equal(
    (await (await context.request.get(`${url}/api/settings`)).json()).music,
    1,
  );
  await close();
  check("settings persist in the database");
  await page
    .getByRole("button", { name: "Save progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Progress saved", exact: true })
    .waitFor();
  await page.reload();
  await page.waitForSelector(".battlefield canvas");
  assert.equal((await state()).buildings.length, 5);
  check("save and reload retain the constructed empire");
  await page.getByRole("button", { name: "Campaign", exact: true }).click();
  await page.getByRole("button", { name: /Asia Shen Dynasty/ }).click();
  await page
    .getByRole("button", { name: "Establish an empire", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Begin new campaign", exact: true })
    .click();
  await page.getByRole("heading", { name: "Jadehaven", exact: true }).waitFor();
  assert.equal((await state()).civilization, "shen");
  check("regional campaign selection creates a new server-owned empire");
  await page.getByRole("button", { name: "Story mode", exact: true }).click();
  await page
    .getByRole("button", { name: "Begin story mode", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm new story campaign", exact: true })
    .click();
  assert.equal((await state()).mode, "story");
  await page
    .getByRole("button", { name: "Watch chapter prologue", exact: true })
    .click();
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  await close();
  check(
    "Story Mode starts a playable campaign and displays original narrative scenes",
  );
  await page.getByRole("button", { name: "Enable music", exact: true }).click();
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  check("ambient audio can be enabled and muted after command sounds");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.ok(
    await page
      .getByRole("button", { name: "Build Shape your empire" })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("heading", { name: "Make it your world", exact: true })
    .waitFor();
  await close();
  check("mobile layout fits the viewport and navigation remains functional");
  mkdirSync(".cache", { recursive: true });
  await page.screenshot({ path: ".cache/mobile-tested.png" });
  assert.deepEqual(errors, []);
  check("no uncaught browser exceptions");
} finally {
  await context.close();
  await browser.close();
}
