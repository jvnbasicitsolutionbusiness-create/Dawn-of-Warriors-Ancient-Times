import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { newGame, action } from "../server/engine.js";

test("SQLite saves survive closing/reopening the database and owned data cascades on deletion", async () => {
  mkdirSync(".cache", { recursive: true });
  const directory = mkdtempSync(".cache/persistence-");
  const file = join(directory, "test.sqlite");
  process.env.DB_PATH = file;
  const { db, createUser, saveGame } = await import("../server/db.js");
  const user = createUser({ fullName: "Persistence Test" });
  const game = newGame();
  action(game, "build", { building: "farm", x: -10, z: -5 });
  saveGame(user.id, game);
  db.close();
  const reopened = new DatabaseSync(file);
  reopened.exec("PRAGMA foreign_keys=ON");
  try {
    const row = reopened
      .prepare("SELECT state FROM game_saves WHERE user_id=?")
      .get(user.id);
    const loaded = JSON.parse(row.state);
    assert.equal(loaded.buildings.length, 5);
    assert.equal(loaded.buildings.at(-1).type, "farm");
    assert.equal(loaded.resources.wood, 900);
    assert.equal(loaded.civilization, "aurelia");
    assert.equal(
      reopened
        .prepare(
          "SELECT COUNT(*) as total FROM player_profiles WHERE user_id=?",
        )
        .get(user.id).total,
      1,
    );
    reopened.prepare("DELETE FROM users WHERE id=?").run(user.id);
    assert.equal(
      reopened
        .prepare("SELECT COUNT(*) as total FROM game_saves WHERE user_id=?")
        .get(user.id).total,
      0,
    );
    assert.equal(
      reopened
        .prepare(
          "SELECT COUNT(*) as total FROM player_settings WHERE user_id=?",
        )
        .get(user.id).total,
      0,
    );
  } finally {
    reopened.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
