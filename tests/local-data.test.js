import test from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
};

const {
  getGame,
  getSettings,
  performAction,
  saveGame,
  saveSettings,
  startGame,
} = await import("../src/services/localData.js");

test("campaign actions persist and restore from browser storage", () => {
  const initial = getGame();
  const updated = performAction("build", {
    building: "farm",
    x: -10,
    z: -5,
  });

  assert.equal(updated.buildings.length, initial.buildings.length + 1);
  assert.equal(getGame().buildings.at(-1).type, "farm");
  assert.equal(saveGame().tick, updated.tick);
});

test("campaign selection and preferences persist locally", () => {
  const campaign = startGame("shen", "campaign");
  assert.equal(campaign.civilization, "shen");
  assert.equal(campaign.workers.length, 1);
  assert.equal(getGame().civilization, "shen");

  const settings = { ...getSettings(), reducedMotion: true };
  saveSettings(settings);
  assert.equal(getSettings().reducedMotion, true);
});

