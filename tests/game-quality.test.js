import test from "node:test";
import assert from "node:assert/strict";
import { GAME_RULES } from "../shared/catalog.js";
import { createSpriteSheet } from "../src/game/sprites.js";

test("shared game rules expose a tuned structure and sprite sheets produce valid atlases", () => {
  assert.ok(GAME_RULES.startingResources.food < 200);
  assert.ok(GAME_RULES.startingResources.gold === 0);
  assert.deepEqual(GAME_RULES.startingInventory, [
    "pickaxe",
    "fishing_rod",
    "bucket",
  ]);
  assert.ok(GAME_RULES.maxArmySize >= 6);
  assert.ok(GAME_RULES.raidInterval >= 30);

  const sheet = createSpriteSheet("guardian", ["#416d7b", "#d3b98a"], 4);
  assert.equal(sheet.frames, 4);
  assert.ok(sheet.width >= 128);
  assert.ok(sheet.frameWidth > 0);
  assert.ok(sheet.frameHeight > 0);
});
