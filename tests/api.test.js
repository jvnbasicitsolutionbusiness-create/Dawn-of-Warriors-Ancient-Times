import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync, existsSync, rmSync } from "node:fs";
const port = 3198,
  base = `http://127.0.0.1:${port}`;
let server, guestCookie, accountCookie, verifyToken;
async function call(url, body, cookie, extra = {}) {
  const r = await fetch(`${base}/api${url}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...extra,
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.getSetCookie().at(-1)?.split(";")[0],
    headers: r.headers,
  };
}
before(async () => {
  server = spawn(process.execPath, ["server/index.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      DB_PATH: ":memory:",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("API test server did not start")),
      15000,
    );
    server.stdout.on("data", (b) => {
      if (b.toString().includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("error", reject);
    server.on("exit", (code) => {
      if (code) reject(Error(`Server exited: ${code}`));
    });
  });
});
after(async () => {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
});
test("unauthenticated game routes return 401", async () => {
  assert.equal((await call("/game")).status, 401);
});
test("guest sessions are real, httpOnly server sessions", async () => {
  const r = await call("/auth/guest", {});
  assert.equal(r.status, 200);
  assert.equal(r.data.user.guest, true);
  assert.ok(r.headers.get("set-cookie").includes("HttpOnly"));
  assert.ok(r.headers.get("set-cookie").includes("SameSite=Lax"));
  guestCookie = r.cookie;
  assert.equal(
    (await call("/game", undefined, guestCookie)).data.population,
    12,
  );
});
test("cross-origin mutations are blocked", async () => {
  const r = await call("/game/action", { type: "pause" }, guestCookie, {
    headers: {
      "Content-Type": "application/json",
      Cookie: guestCookie,
      Origin: "https://untrusted.example",
    },
  });
  assert.equal(r.status, 403);
});
test("clients cannot supply resources or arbitrary saves", async () => {
  const before = (await call("/game", undefined, guestCookie)).data;
  const r = await call(
    "/game/action",
    { type: "resources", data: { gold: 999999 } },
    guestCookie,
  );
  assert.equal(r.status, 400);
  await call(
    "/game/save",
    { resources: { gold: 999999 }, technologies: ["steel"] },
    guestCookie,
  );
  const after = (await call("/game", undefined, guestCookie)).data;
  assert.ok(after.resources.gold < 999999);
  assert.equal(after.technologies.length, 0);
  assert.equal(after.civilization, before.civilization);
});
test("server recruitment commands persist on subsequent reads", async () => {
  const r = await call(
    "/game/action",
    { type: "recruit", data: { character: "unit-0-0" } },
    guestCookie,
  );
  assert.equal(r.status, 200);
  assert.equal(r.data.recruiting.length, 1);
  const s = await call("/game", undefined, guestCookie);
  assert.equal(s.data.recruiting[0].id, r.data.recruiting[0].id);
});
test("registration rejects weak passwords and creates an unverified account", async () => {
  const body = {
    fullName: "Test Commander",
    username: "test_commander",
    email: "commander@example.test",
    password: "weak",
    confirmPassword: "weak",
    terms: true,
  };
  assert.equal((await call("/auth/register", body, guestCookie)).status, 400);
  body.password = body.confirmPassword = "StrongSecret123";
  const r = await call("/auth/register", body, guestCookie);
  assert.equal(r.status, 201);
  assert.ok(r.data.developmentLink);
  verifyToken = new URLSearchParams(r.data.developmentLink).get("verify");
  assert.equal(
    (await call("/auth/login", { login: body.email, password: body.password }))
      .status,
    403,
  );
});
test("verification is single-use, rotates session, and preserves the guest empire", async () => {
  const r = await call("/auth/verify", { token: verifyToken }, guestCookie);
  assert.equal(r.status, 200);
  assert.equal(r.data.user.verified, true);
  assert.equal(r.data.user.guest, false);
  accountCookie = r.cookie;
  assert.notEqual(accountCookie, guestCookie);
  assert.equal(
    (await call("/auth/verify", { token: verifyToken })).status,
    400,
  );
  assert.equal((await call("/game", undefined, guestCookie)).status, 401);
  const g = await call("/game", undefined, accountCookie);
  assert.equal(g.status, 200);
  assert.ok(g.data.recruiting.length + g.data.recruited >= 1);
});
test("invalid passwords are rejected and suspicious attempts are recorded", async () => {
  assert.equal(
    (
      await call("/auth/login", {
        login: "test_commander",
        password: "WrongPassword123",
      })
    ).status,
    401,
  );
  const profile = await call("/profile", undefined, accountCookie);
  assert.equal(profile.data.securityEvents[0].event, "Failed login");
  assert.ok(!("password_hash" in profile.data.user));
});
test("password changes revoke prior sessions, and logout revokes the current one", async () => {
  const second = await call("/auth/login", {
    login: "test_commander",
    password: "StrongSecret123",
  });
  assert.equal(second.status, 200);
  const changed = await call(
    "/auth/password",
    { currentPassword: "StrongSecret123", password: "ChangedSecret123" },
    accountCookie,
  );
  assert.equal(changed.status, 200);
  assert.equal((await call("/game", undefined, second.cookie)).status, 401);
  assert.equal((await call("/game", undefined, accountCookie)).status, 401);
  accountCookie = changed.cookie;
  assert.equal((await call("/game", undefined, accountCookie)).status, 200);
  await call("/auth/logout", {}, accountCookie);
  assert.equal((await call("/game", undefined, accountCookie)).status, 401);
});
test("a returning login loads the same saved world and owner-specific preferences", async () => {
  const r = await call("/auth/login", {
    login: "commander@example.test",
    password: "ChangedSecret123",
  });
  accountCookie = r.cookie;
  assert.equal(r.status, 200);
  const settings = (await call("/settings", undefined, accountCookie)).data;
  settings.music = 37;
  const saved = await call("/settings", settings, accountCookie, {
    method: "PUT",
  });
  assert.equal(saved.status, 200);
  assert.equal(
    (await call("/settings", undefined, accountCookie)).data.music,
    37,
  );
  assert.equal(
    (await call("/game", undefined, accountCookie)).data.civilization,
    "aurelia",
  );
});
test("reset tokens are single-use and invalidate every old session", async () => {
  const r = await call("/auth/forgot", { email: "commander@example.test" });
  assert.equal(r.status, 200);
  assert.ok(!r.data.token && !r.data.developmentLink);
  const mail = readFileSync("data/mailbox.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .reverse()
    .find(
      (m) => m.to === "commander@example.test" && m.url.includes("?reset="),
    );
  const token = new URL(mail.url).searchParams.get("reset");
  assert.equal(
    (await call("/auth/reset", { token, password: "RecoveredSecret123" }))
      .status,
    200,
  );
  assert.equal((await call("/game", undefined, accountCookie)).status, 401);
  assert.equal(
    (await call("/auth/reset", { token, password: "OtherSecret123" })).status,
    400,
  );
  const login = await call("/auth/login", {
    login: "test_commander",
    password: "RecoveredSecret123",
  });
  assert.equal(login.status, 200);
  accountCookie = login.cookie;
});
test("locked expansion regions cannot be started through the API", async () => {
  for (const civilization of ["africa", "australia"])
    assert.equal(
      (
        await call(
          "/game/new",
          { civilization, mode: "campaign" },
          accountCookie,
        )
      ).status,
      400,
    );
});
test("delete requires a valid password and cascades account-owned data", async () => {
  assert.equal(
    (await call("/auth/delete", { password: "incorrect" }, accountCookie))
      .status,
    400,
  );
  assert.equal(
    (
      await call(
        "/auth/delete",
        { password: "RecoveredSecret123" },
        accountCookie,
      )
    ).status,
    200,
  );
  assert.equal((await call("/game", undefined, accountCookie)).status, 401);
  assert.equal(
    (
      await call("/auth/login", {
        login: "test_commander",
        password: "ChangedSecret123",
      })
    ).status,
    401,
  );
});

test("HTTPS preview sessions support secure partitioned iframe cookies", async () => {
  const r = await call("/auth/guest", {}, undefined, {
    headers: {
      "Content-Type": "application/json",
      Host: "3000-test.e2b.app",
      "X-Forwarded-Host": "3000-test.e2b.app",
      "X-Forwarded-Proto": "https",
    },
  });
  assert.equal(r.status, 200);
  const header = r.headers.get("set-cookie");
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  assert.match(header, /SameSite=None/);
  assert.match(header, /Partitioned/);
});
