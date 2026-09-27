import test from "node:test";
import assert from "node:assert/strict";
import {
  newGame,
  action,
  step,
  makeArmy,
  rates,
  publicGame,
} from "../server/engine.js";
import { CHARACTERS, BUILDINGS, TECHNOLOGIES } from "../shared/catalog.js";
const advance = (s, n) => {
  for (let i = 0; i < n; i++) step(s);
};
test("54 uniquely named warriors in six factions, with distinct combat roles", () => {
  assert.equal(CHARACTERS.length, 54);
  assert.equal(new Set(CHARACTERS.map((c) => c.name)).size, 54);
  assert.equal(CHARACTERS.filter((c) => c.enemy).length, 27);
  assert.equal(new Set(CHARACTERS.map((c) => c.class)).size, 9);
});
test("every building and technology has a valid catalog reference", () => {
  assert.equal(BUILDINGS.length, 18);
  assert.equal(TECHNOLOGIES.length, 14);
  for (const b of BUILDINGS)
    if (b.requires) assert.ok(TECHNOLOGIES.some((t) => t.id === b.requires));
  for (const c of CHARACTERS)
    assert.ok(BUILDINGS.some((b) => b.id === c.building));
});
test("server computes starting population, storage, and resource production", () => {
  const s = newGame();
  assert.equal(publicGame(s).population, 12);
  assert.equal(publicGame(s).capacity, 40);
  const before = s.resources.food;
  step(s);
  assert.equal(s.resources.food, before + rates(s).food);
});
test("regional bonuses affect real economic production", () => {
  assert.equal(rates(newGame("shen")).food, rates(newGame()).food * 1.2);
  assert.equal(rates(newGame("ashur")).gold, rates(newGame()).gold * 1.25);
});
test("invalid or unaffordable construction does not deduct resources", () => {
  const s = newGame();
  const before = { ...s.resources };
  assert.throws(
    () => action(s, "build", { building: "farm", x: 40, z: 30 }),
    /borders/,
  );
  assert.deepEqual(s.resources, before);
  s.resources.wood = 0;
  assert.throws(
    () => action(s, "build", { building: "farm", x: -10, z: -5 }),
    /wood/,
  );
  assert.equal(s.buildings.length, 4);
});
test("building collisions and nonfinite coordinates are rejected", () => {
  const s = newGame();
  assert.throws(
    () => action(s, "build", { building: "farm", x: -15, z: 7 }),
    /space/,
  );
  assert.throws(
    () => action(s, "build", { building: "farm", x: NaN, z: 7 }),
    /valid/,
  );
});
test("construction charges catalog cost and production waits for completion", () => {
  const s = newGame(),
    before = s.resources.wood,
    rate = rates(s).food;
  action(s, "build", { building: "farm", x: -10, z: -5, cost: { wood: 0 } });
  assert.equal(s.resources.wood, before - 80);
  assert.equal(rates(s).food, rate);
  advance(s, 8);
  assert.equal(s.buildings.at(-1).readyAt, 0);
  assert.equal(rates(s).food, rate + 5);
});
test("recruitment validates faction, prerequisites, population, and queues cohorts", () => {
  const s = newGame();
  assert.throws(
    () => action(s, "recruit", { character: "unit-3-0" }),
    /civilization/,
  );
  assert.throws(
    () => action(s, "recruit", { character: "unit-0-4" }),
    /Stable/,
  );
  action(s, "recruit", { character: "unit-0-0" });
  assert.equal(s.recruiting.length, 1);
  advance(s, 8);
  assert.equal(s.recruited, 1);
  assert.equal(publicGame(s).population, 18);
  assert.equal(s.recruiting.length, 0);
});
test("research prerequisites and duplicate unlocks cannot be bypassed", () => {
  const s = newGame();
  assert.throws(
    () => action(s, "research", { technology: "steel" }),
    /prerequisite/,
  );
  action(s, "research", { technology: "forging" });
  assert.throws(
    () => action(s, "research", { technology: "agriculture" }),
    /already/,
  );
  advance(s, 20);
  assert.ok(s.technologies.includes("forging"));
  assert.throws(
    () => action(s, "research", { technology: "forging" }),
    /already/,
  );
});
test("movement stays authoritative and routes crossing armies over the bridge", () => {
  const s = newGame();
  action(s, "move", { ids: ["legion"], x: 26, z: -10 });
  assert.equal(s.armies[0].path.length, 3);
  assert.equal(s.armies[0].path[0].z, 3);
  assert.throws(
    () => action(s, "move", { ids: ["legion"], x: 1000, z: 0 }),
    /Invalid/,
  );
  const x = s.armies[0].x;
  step(s);
  assert.notEqual(s.armies[0].x, x);
});
test("orders cannot move an enemy cohort", () => {
  const s = newGame(),
    enemy = s.armies.find((a) => a.enemy);
  action(s, "move", { ids: [enemy.id], x: 0, z: 0 });
  assert.equal(enemy.path.length, 0);
});
test("real-time combat applies damage, records death, and grants experience", () => {
  const s = newGame();
  s.armies = [
    makeArmy("unit-0-0", 0, 0, false, "friend"),
    makeArmy("unit-3-0", 1, 0, true, "enemy"),
  ];
  s.armies[1].hp = 1;
  step(s);
  assert.equal(s.armies.length, 1);
  assert.equal(s.armies[0].hp, s.armies[0].maxHp);
  assert.equal(s.kills, 1);
  assert.equal(s.armies[0].xp, 50);
});
test("formation selection has a real defensive and movement effect", () => {
  const a = newGame(),
    b = newGame();
  a.armies = [
    makeArmy("unit-0-0", 0, 0, false, "friend"),
    makeArmy("unit-3-0", 1, 0, true, "enemy"),
  ];
  b.armies = structuredClone(a.armies);
  action(b, "formation", { formation: "defensive" });
  step(a);
  step(b);
  assert.ok(b.armies[0].hp > a.armies[0].hp);
  assert.throws(
    () => action(b, "formation", { formation: "invincible" }),
    /Invalid/,
  );
});
test("capturing an undefended territory changes ownership and grants rewards once", () => {
  const s = newGame();
  s.armies = s.armies.filter((a) => !a.enemy);
  s.armies.forEach((a) => {
    a.x = 26;
    a.z = 1;
  });
  const before = s.resources.gold;
  advance(s, 17);
  assert.equal(s.sites[0].owner, "player");
  assert.equal(s.victories, 1);
  assert.ok(s.resources.gold >= before + 250);
  advance(s, 3);
  assert.equal(s.victories, 1);
});
test("truce stops combat and expires after the negotiated period", () => {
  const s = newGame();
  s.armies = [makeArmy("unit-0-0", 0, 0), makeArmy("unit-3-0", 1, 0, true)];
  action(s, "diplomacy");
  const hp = s.armies[0].hp;
  advance(s, 80);
  assert.equal(s.armies[0].hp, hp);
  assert.equal(s.diplomacy, "truce");
  advance(s, 11);
  assert.equal(s.diplomacy, "war");
  assert.ok(s.armies[0].hp < hp);
});
test("story rewards require server-owned objectives and cannot be replayed", () => {
  const s = newGame("aurelia", "story");
  assert.throws(() => action(s, "claim"), /objectives/);
  action(s, "build", { building: "farm", x: -10, z: -5 });
  action(s, "recruit", { character: "unit-0-0" });
  advance(s, 8);
  action(s, "claim");
  assert.equal(s.chapter, 1);
  assert.deepEqual(s.completedChapters, [0]);
  assert.throws(() => action(s, "claim"), /objectives/);
  assert.throws(() => action(newGame(), "claim"), /Story Mode/);
});
test("paused simulations do not advance and saves roundtrip without lost state", () => {
  const s = newGame();
  action(s, "pause");
  step(s);
  assert.equal(s.tick, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});
test("AI waits through the opening grace period and then sends a raid", () => {
  const s = newGame();
  advance(s, 149);
  assert.equal(s.armies.filter((a) => a.enemy).length, 3);
  step(s);
  assert.equal(s.armies.filter((a) => a.enemy).length, 4);
  assert.ok(s.armies.at(-1).path.length > 0);
});
test("the fall of the capital ends the campaign without losing the save", () => {
  const s = newGame();
  s.buildings.find((b) => b.id === "capital").hp = 0;
  step(s);
  assert.equal(s.outcome, "defeat");
  assert.equal(s.defeats, 1);
  assert.throws(() => action(s, "recruit", { character: "unit-0-0" }), /ended/);
});
