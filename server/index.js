import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import auth, { identify, requireUser } from "./auth.js";
import { db, saveGame, safeUser } from "./db.js";
import { newGame, action, step, publicGame } from "./engine.js";
import { CIVILIZATIONS, DEFAULT_SETTINGS } from "../shared/catalog.js";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app = express();
const production = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: production
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            frameAncestors: null,
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/assets", express.static(path.join(root, "assets")));
app.use("/assets", express.static(path.join(root, "public/assets")));
app.use("/boot", express.static(path.join(root, "public/boot")));
app.use("/public", express.static(path.join(root, "public")));
app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  res.set("Cache-Control", "no-store");

  if (origin) {
    const allowed = new Set([
      `http://${req.headers.host}`,
      `https://${req.headers.host}`,
      `${req.protocol}://${req.hostname}`,
      process.env.APP_URL,
      ...(process.env.CLIENT_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      "http://localhost:3002",
      "http://127.0.0.1:3002",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "null",
    ]);
    if (origin && allowed.has(origin)) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
    } else {
      const normalized = origin.replace(/:\d+/, "");
      const hostless = [
        "http://localhost",
        "http://127.0.0.1",
        "https://localhost",
        "https://127.0.0.1",
        "null",
      ];
      if (!hostless.some((base) => normalized === base)) {
        return res.status(403).json({ error: "Untrusted request origin." });
      }
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
    }
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (!req.is("application/json"))
      return res.status(415).json({ error: "Use application/json." });
  }
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 240,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
  }),
);
app.use("/api", identify);
app.use("/api/auth", auth);
const worlds = new Map();
function world(id) {
  let entry = worlds.get(id);
  if (!entry) {
    const row = db
      .prepare("SELECT state FROM game_saves WHERE user_id=?")
      .get(id);
    entry = {
      state: row ? JSON.parse(row.state) : newGame(),
      active: Date.now(),
    };
    worlds.set(id, entry);
    saveGame(id, entry.state);
  }
  entry.active = Date.now();
  return entry.state;
}
app.use("/api/game", requireUser);
app.get("/api/game", (req, res) => res.json(publicGame(world(req.user.id))));
app.post("/api/game/action", (req, res) => {
  const { type, data } = z
    .object({
      type: z.string().max(30),
      data: z.record(z.unknown()).optional(),
    })
    .parse(req.body);
  const s = world(req.user.id);
  action(s, type, data);
  saveGame(req.user.id, s);
  res.json(publicGame(s));
});
app.post("/api/game/save", (req, res) => {
  const s = world(req.user.id);
  saveGame(req.user.id, s);
  res.json({ savedAt: Date.now(), tick: s.tick });
});
app.post("/api/game/new", (req, res) => {
  const { civilization, mode } = z
    .object({
      civilization: z.enum(CIVILIZATIONS.map((c) => c.id)),
      mode: z.enum(["campaign", "story", "starter"]),
    })
    .parse(req.body);
  const s = newGame(civilization, mode);
  worlds.set(req.user.id, { state: s, active: Date.now() });
  saveGame(req.user.id, s);
  res.json(publicGame(s));
});
app.get("/api/profile", requireUser, (req, res) => {
  const s = world(req.user.id);
  res.json({
    user: safeUser(req.user),
    level:
      1 +
      Math.floor(
        (s.kills * 50 + s.victories * 200 + s.technologies.length * 80) / 300,
      ),
    xp: s.kills * 50 + s.victories * 200 + s.technologies.length * 80,
    victories: s.victories,
    defeats: s.defeats,
    territories: s.sites.filter((t) => t.owner === "player").map((t) => t.name),
    sessions: db
      .prepare(
        "SELECT COUNT(*) as count FROM sessions WHERE user_id=? AND expires_at>?",
      )
      .get(req.user.id, Date.now()).count,
    securityEvents: db
      .prepare(
        "SELECT event,created_at FROM security_events WHERE user_id=? ORDER BY created_at DESC LIMIT 5",
      )
      .all(req.user.id),
  });
});
app.get("/api/settings", requireUser, (req, res) =>
  res.json(
    JSON.parse(
      db
        .prepare("SELECT data FROM player_settings WHERE user_id=?")
        .get(req.user.id).data,
    ),
  ),
);
app.put("/api/settings", requireUser, (req, res) => {
  const data = z
    .object({
      music: z.number().min(0).max(100),
      sound: z.number().min(0).max(100),
      graphics: z.enum(["Low", "Medium", "High"]),
      camera: z.number().min(10).max(100),
      notifications: z.boolean(),
      reducedMotion: z.boolean(),
      showHealth: z.boolean(),
      language: z.literal("English"),
    })
    .parse(req.body);
  db.prepare("UPDATE player_settings SET data=? WHERE user_id=?").run(
    JSON.stringify(data),
    req.user.id,
  );
  res.json(data);
});
app.get("/api/health", (req, res) => res.json({ ok: true, version: "0.1.0" }));
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof z.ZodError)
    return res.status(400).json({ error: err.issues[0].message });
  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.path}: ${err.message}`,
  );
  res
    .status(err.status || 400)
    .json({
      error: err.message || "The request could not be completed.",
      ...(err.code ? { code: err.code } : {}),
    });
});
if (production) {
  app.use("/public", express.static(path.join(root, "public")));
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*splat}", (req, res) =>
    res.sendFile(path.join(root, "dist/lobby.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: {
      middlewareMode: true,
      allowedHosts: true,
      hmr: process.env.NODE_ENV === "test" ? false : undefined,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
let ticks = 0;
const timer = setInterval(() => {
  ticks++;
  for (const [id, e] of worlds) {
    if (!db.prepare("SELECT id FROM users WHERE id=?").get(id)) {
      worlds.delete(id);
      continue;
    }
    if (Date.now() - e.active < 20000) {
      step(e.state);
      if (ticks % 5 === 0) {
        if (db.prepare("SELECT id FROM users WHERE id=?").get(id))
          saveGame(id, e.state);
        else worlds.delete(id);
      }
    } else if (Date.now() - e.active > 180000) {
      saveGame(id, e.state);
      worlds.delete(id);
    }
  }
  if (ticks % 3600 === 0) {
    db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
    db.prepare("DELETE FROM account_tokens WHERE expires_at<?").run(Date.now());
  }
}, 1000);
const server = app.listen(Number(process.env.PORT || 3002), "0.0.0.0", () =>
  console.log(
    `Dawn of Warriors listening on 0.0.0.0:${process.env.PORT || 3002}`,
  ),
);
function shutdown() {
  clearInterval(timer);
  for (const [id, e] of worlds)
    if (db.prepare("SELECT id FROM users WHERE id=?").get(id))
      saveGame(id, e.state);
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
