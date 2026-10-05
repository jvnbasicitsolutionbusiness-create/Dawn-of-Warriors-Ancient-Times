import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS } from "../shared/catalog.js";
mkdirSync("data", { recursive: true });
export const db = new DatabaseSync(process.env.DB_PATH || "data/dawn.sqlite");
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,full_name TEXT NOT NULL,username TEXT UNIQUE NOT NULL,email TEXT UNIQUE,password_hash TEXT,is_guest INTEGER NOT NULL DEFAULT 1,verified INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS player_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,avatar TEXT NOT NULL DEFAULT 'commander',bio TEXT NOT NULL DEFAULT 'A new legend begins.');
CREATE TABLE IF NOT EXISTS player_settings(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS game_saves(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,state TEXT NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS account_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_events(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,event TEXT NOT NULL,created_at INTEGER NOT NULL);
`);
export function createUser({
  fullName = "Wanderer",
  username,
  email = null,
  passwordHash = null,
  guest = true,
}) {
  const id = randomUUID();
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?,?)").run(
    id,
    fullName,
    username || `guest-${id}`,
    email,
    passwordHash,
    guest ? 1 : 0,
    0,
    Date.now(),
  );
  db.prepare("INSERT INTO player_profiles(user_id) VALUES(?)").run(id);
  db.prepare("INSERT INTO player_settings VALUES(?,?)").run(
    id,
    JSON.stringify(DEFAULT_SETTINGS),
  );
  return db.prepare("SELECT * FROM users WHERE id=?").get(id);
}
export function saveGame(id, state) {
  db.prepare(
    "INSERT INTO game_saves VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at",
  ).run(id, JSON.stringify(state), Date.now());
}
export function safeUser(u) {
  return {
    id: u.id,
    name: u.full_name,
    username: u.is_guest ? "Guest commander" : u.username,
    email: u.email,
    guest: !!u.is_guest,
    verified: !!u.verified,
  };
}
