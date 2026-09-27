import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { randomBytes, createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { z } from "zod";
import { db, createUser, safeUser, saveGame } from "./db.js";
const prod = process.env.NODE_ENV === "production";
export const hash = (t) => createHash("sha256").update(t).digest("hex");
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: prod,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};
// Partitioned secure cookies keep sessions functional in the embedded HTTPS preview.
function sessionOptions(req) {
  const preview = /(^|\.)e2b\.app$/.test(req.hostname);
  return {
    ...cookieOptions,
    sameSite: preview ? "none" : "lax",
    secure: prod || preview || req.secure,
    partitioned: preview,
  };
}
export function session(res, id) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(
    hash(token),
    id,
    Date.now() + cookieOptions.maxAge,
    Date.now(),
  );
  res.cookie("dawn_session", token, sessionOptions(res.req));
}
export function identify(req, res, next) {
  const token = req.cookies.dawn_session;
  if (token) {
    const row = db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?",
      )
      .get(hash(token), Date.now());
    if (row) req.user = row;
  }
  next();
}
export function requireUser(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ error: "Sign in or begin a guest campaign." });
  if (!req.user.is_guest && !req.user.verified)
    return res.status(403).json({ error: "Please verify your email first." });
  next();
}
export function revoke(req, res) {
  if (req.cookies.dawn_session)
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
      hash(req.cookies.dawn_session),
    );
  res.clearCookie("dawn_session", sessionOptions(req));
}
async function sendLink(user, kind) {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM account_tokens WHERE user_id=? AND kind=?").run(
    user.id,
    kind,
  );
  db.prepare("INSERT INTO account_tokens VALUES(?,?,?,?)").run(
    hash(token),
    user.id,
    kind,
    Date.now() + 1000 * 60 * 30,
  );
  const url = `${process.env.APP_URL || "http://localhost:3000"}/?${kind}=${token}`;
  const subject =
    kind === "verify"
      ? "Verify your Dawn of Warriors account"
      : "Reset your Dawn of Warriors password";
  if (process.env.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM || "Dawn of Warriors <noreply@example.com>",
      to: user.email,
      subject,
      text: `${subject}\n\n${url}\n\nThis one-time link expires in 30 minutes.`,
    });
  } else if (!prod) {
    appendFileSync(
      "data/mailbox.jsonl",
      JSON.stringify({ to: user.email, subject, url, time: Date.now() }) + "\n",
    );
  } else throw Error("Email delivery is not configured.");
  return !prod && !process.env.SMTP_HOST ? `?${kind}=${token}` : undefined;
}
const password = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[0-9]/, "Include a number.");
const router = Router();
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: "Too many account requests. Please try again in 15 minutes.",
    },
  }),
);
router.get("/me", (req, res) =>
  res.json({ user: req.user ? safeUser(req.user) : null }),
);
router.post("/guest", (req, res) => {
  if (req.user) return res.json({ user: safeUser(req.user) });
  const u = createUser({});
  session(res, u.id);
  res.json({ user: safeUser(u) });
});
router.post("/register", async (req, res) => {
  const v = z
    .object({
      fullName: z.string().trim().min(2).max(80),
      username: z
        .string()
        .min(3)
        .max(24)
        .regex(/^[a-zA-Z0-9_]+$/),
      email: z
        .string()
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      password,
      confirmPassword: z.string(),
      terms: z.literal(true),
    })
    .parse(req.body);
  if (v.password !== v.confirmPassword) throw Error("Passwords do not match.");
  if (
    db
      .prepare("SELECT id FROM users WHERE email=? OR username=?")
      .get(v.email, v.username)
  )
    throw Error("This email or username is unavailable.");
  if (prod && !process.env.SMTP_HOST)
    throw Error(
      "Account email delivery is not configured. Please contact the administrator.",
    );
  const passwordHash = await bcrypt.hash(v.password, 12);
  const u = createUser({ ...v, passwordHash, guest: false });
  if (req.user?.is_guest) {
    const old = db
      .prepare("SELECT state FROM game_saves WHERE user_id=?")
      .get(req.user.id);
    if (old) saveGame(u.id, JSON.parse(old.state));
  }
  let developmentLink;
  try {
    developmentLink = await sendLink(u, "verify");
  } catch (e) {
    db.prepare("DELETE FROM users WHERE id=?").run(u.id);
    throw e;
  }
  res
    .status(201)
    .json({
      message:
        "Check your email to verify your account. Your guest empire has been copied to it.",
      developmentLink,
    });
});
router.post("/verify", (req, res) => {
  const { token } = z.object({ token: z.string().length(64) }).parse(req.body);
  const row = db
    .prepare(
      "SELECT * FROM account_tokens WHERE token_hash=? AND kind=? AND expires_at>?",
    )
    .get(hash(token), "verify", Date.now());
  if (!row) throw Error("This verification link is invalid or expired.");
  db.prepare("UPDATE users SET verified=1 WHERE id=?").run(row.user_id);
  db.prepare("DELETE FROM account_tokens WHERE token_hash=?").run(hash(token));
  revoke(req, res);
  session(res, row.user_id);
  res.json({
    user: safeUser(
      db.prepare("SELECT * FROM users WHERE id=?").get(row.user_id),
    ),
  });
});
router.post("/login", async (req, res) => {
  const { login, password: pw } = z
    .object({ login: z.string().max(254), password: z.string().max(128) })
    .parse(req.body);
  const u = db
    .prepare("SELECT * FROM users WHERE email=? OR username=?")
    .get(login.toLowerCase(), login);
  const ok = await bcrypt.compare(
    pw,
    u?.password_hash ||
      "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxhZZDgxVlxl7SWczOMAwNFmPfS",
  );
  if (!u || !ok) {
    if (u)
      db.prepare(
        "INSERT INTO security_events(user_id,event,created_at) VALUES(?,?,?)",
      ).run(u.id, "Failed login", Date.now());
    return res.status(401).json({ error: "Invalid username or password." });
  }
  if (!u.verified)
    return res
      .status(403)
      .json({ error: "Verify your email before signing in." });
  revoke(req, res);
  session(res, u.id);
  res.json({ user: safeUser(u) });
});
router.post("/forgot", async (req, res) => {
  const { email } = z
    .object({
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
    })
    .parse(req.body);
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (u) {
    try {
      await sendLink(u, "reset");
    } catch (e) {
      console.error("Recovery email delivery failed:", e.message);
    }
  }
  res.json({
    message:
      "If that account exists, a recovery link has been sent." +
      (!prod
        ? " In local development, emails are written to data/mailbox.jsonl."
        : ""),
  });
});
router.post("/reset", async (req, res) => {
  const { token, password: pw } = z
    .object({ token: z.string().length(64), password })
    .parse(req.body);
  const row = db
    .prepare(
      "SELECT * FROM account_tokens WHERE token_hash=? AND kind=? AND expires_at>?",
    )
    .get(hash(token), "reset", Date.now());
  if (!row) throw Error("This reset link is invalid or expired.");
  db.prepare("UPDATE users SET password_hash=?, verified=1 WHERE id=?").run(
    await bcrypt.hash(pw, 12),
    row.user_id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(row.user_id);
  db.prepare("DELETE FROM account_tokens WHERE user_id=?").run(row.user_id);
  res.json({ message: "Password updated. You can now sign in." });
});
router.post("/password", requireUser, async (req, res) => {
  if (req.user.is_guest) throw Error("Register an account first.");
  const v = z
    .object({ currentPassword: z.string().max(128), password })
    .parse(req.body);
  if (!(await bcrypt.compare(v.currentPassword, req.user.password_hash)))
    throw Error("Current password is incorrect.");
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
    await bcrypt.hash(v.password, 12),
    req.user.id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(req.user.id);
  session(res, req.user.id);
  res.json({ message: "Password changed. Other sessions were signed out." });
});
router.post("/logout", (req, res) => {
  revoke(req, res);
  res.json({ ok: true });
});
router.post("/logout-all", requireUser, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(req.user.id);
  res.clearCookie("dawn_session", sessionOptions(req));
  res.json({ ok: true });
});
router.post("/delete", requireUser, async (req, res) => {
  if (
    !req.user.is_guest &&
    !(await bcrypt.compare(
      String(req.body.password || ""),
      req.user.password_hash,
    ))
  )
    throw Error("Confirm your password to delete this account.");
  db.prepare("DELETE FROM users WHERE id=?").run(req.user.id);
  revoke(req, res);
  res.json({ ok: true });
});
export default router;
