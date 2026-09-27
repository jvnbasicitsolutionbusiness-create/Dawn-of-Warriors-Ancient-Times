import React, { useState } from "react";
import { DEFAULT_SETTINGS } from "../../shared/catalog";
import { api } from "../services/api";
import { Icon, Button } from "./UI";
export function AuthPanel({ onAuthenticated, initial = "login", token }) {
  const [view, setView] = useState(initial),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [devLink, setDevLink] = useState(null),
    [pw, setPw] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      let result;
      if (view === "register") {
        result = await api("/auth/register", {
          ...form,
          terms: form.terms === "on",
        });
        setMessage(result.message);
        setDevLink(result.developmentLink);
      } else if (view === "forgot") {
        result = await api("/auth/forgot", form);
        setMessage(result.message);
      } else if (view === "reset") {
        result = await api("/auth/reset", { token, password: form.password });
        setMessage(result.message);
        setView("login");
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        result = await api("/auth/login", form);
        await onAuthenticated(result.user);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function change(v) {
    setView(v);
    setError("");
    setMessage("");
    setDevLink(null);
  }
  const strength = [
    pw.length >= 10,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
  ].filter(Boolean).length;
  return (
    <div className="auth-panel">
      <div className="auth-art">
        <img src="/assets/kingdom.jpg" alt="Aurelian capital" />
        <div>
          <Icon name="Crown" size={40} />
          <h2>
            Your empire.
            <br />
            Your legacy.
          </h2>
          <p>Build something history will remember.</p>
          <span>
            <Icon name="ShieldCheck" size={16} /> Server-secured accounts &
            saved progress
          </span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <span className="eyebrow">YOUR JOURNEY BEGINS HERE</span>
        <h3>
          {view === "register"
            ? "Raise your standard"
            : view === "forgot"
              ? "Recover your account"
              : view === "reset"
                ? "Choose a new password"
                : "Welcome back, commander"}
        </h3>
        <p className="muted">
          {view === "register"
            ? "Keep your guest empire and secure your place in history."
            : view === "forgot"
              ? "We’ll send a one-time recovery link to your email."
              : "Your kingdom awaits your return."}
        </p>
        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="form-message success" role="status">
            {message}
          </div>
        )}
        {devLink && (
          <div className="dev-mail">
            <strong>Local development mailbox</strong>
            <p>
              No mail provider is configured in this preview. Use this one-time
              development link to verify your account.
            </p>
            <Button
              icon="Mail"
              onClick={async () => {
                try {
                  const token = new URLSearchParams(devLink).get("verify");
                  const r = await api("/auth/verify", { token });
                  onAuthenticated(r.user);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Verify email in this preview
            </Button>
          </div>
        )}
        {!devLink && (
          <form onSubmit={submit}>
            {view === "register" && (
              <>
                <label>
                  Full name
                  <input
                    required
                    name="fullName"
                    autoComplete="name"
                    minLength="2"
                    maxLength="80"
                    placeholder="Your full name"
                  />
                </label>
                <label>
                  Username
                  <input
                    required
                    name="username"
                    autoComplete="username"
                    minLength="3"
                    maxLength="24"
                    pattern="[a-zA-Z0-9_]+"
                    placeholder="Choose your commander name"
                  />
                </label>
              </>
            )}
            {["register", "forgot"].includes(view) ? (
              <label>
                Email address
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="commander@example.com"
                />
              </label>
            ) : view === "login" ? (
              <label>
                Email or username
                <input
                  required
                  name="login"
                  autoComplete="username"
                  placeholder="Your email or commander name"
                />
              </label>
            ) : null}
            {view !== "forgot" && (
              <label>
                Password
                <div className="password-input">
                  <input
                    required
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete={
                      view === "login" ? "current-password" : "new-password"
                    }
                    minLength={view === "login" ? 1 : 10}
                    maxLength="128"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    <Icon name={show ? "EyeOff" : "Eye"} size={17} />
                  </button>
                </div>
              </label>
            )}
            {["register", "reset"].includes(view) && (
              <>
                <div className="password-strength">
                  {[1, 2, 3, 4].map((i) => (
                    <i className={strength >= i ? "filled" : ""} key={i} />
                  ))}
                  <span>
                    {strength === 4
                      ? "Strong"
                      : "10+ characters, upper/lowercase & number"}
                  </span>
                </div>
                {view === "register" && (
                  <>
                    <label>
                      Confirm password
                      <input
                        required
                        name="confirmPassword"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        minLength="10"
                        placeholder="Enter your password again"
                      />
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="terms" required />
                      <span>
                        I accept the terms: respectful play, account data stored
                        to provide the game, and no commercial guarantees for
                        this development build. I can delete my account in
                        Settings.
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
            {view === "login" && (
              <button
                className="text-btn forgot"
                type="button"
                onClick={() => change("forgot")}
              >
                Forgot password?
              </button>
            )}
            <Button
              variant="gold full"
              disabled={busy}
              icon={
                busy
                  ? "LoaderCircle"
                  : view === "register"
                    ? "Flag"
                    : "ArrowRight"
              }
              type="submit"
            >
              {busy
                ? "Please wait…"
                : view === "register"
                  ? "Create your account"
                  : view === "forgot"
                    ? "Send recovery link"
                    : view === "reset"
                      ? "Reset password"
                      : "Enter your empire"}
            </Button>
          </form>
        )}
        <div className="auth-switch">
          {view === "login" ? (
            <>
              New to the ancient world?{" "}
              <button onClick={() => change("register")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => change("login")}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export function SettingsPanel({
  settings,
  onSave,
  user,
  onLogout,
  toast,
  open,
  audio,
  setAudio,
}) {
  const [values, setValues] = useState(settings),
    [tab, setTab] = useState("Game settings"),
    [saving, setSaving] = useState(false),
    [deleting, setDeleting] = useState(false),
    [pw, setPw] = useState("");
  async function save() {
    setSaving(true);
    try {
      await onSave(values);
      toast("Your preferences have been saved.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }
  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  async function changePassword(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await api("/auth/password", form);
      toast(r.message);
      e.target.reset();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <>
      <div className="tabs padded">
        {["Game settings", "Account & security"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Game settings" ? (
        <div className="settings-content">
          <div className="settings-columns">
            <section>
              <h3>
                <Icon name="Volume2" />
                Audio
              </h3>
              <div className="setting-row">
                <div>
                  <strong>Ambient music</strong>
                  <small>Original, procedurally generated soundscape</small>
                </div>
                <button
                  className={`toggle ${audio ? "on" : ""}`}
                  role="switch"
                  aria-checked={audio}
                  aria-label="Ambient music"
                  onClick={() => setAudio(!audio)}
                >
                  <i />
                </button>
              </div>
              {[
                ["music", "Music volume"],
                ["sound", "Command effects"],
              ].map(([id, name]) => (
                <label className="range-setting" key={id}>
                  <span>
                    {name}
                    <b>{values[id]}%</b>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={values[id]}
                    onChange={(e) => set(id, +e.target.value)}
                  />
                </label>
              ))}
              <h3>
                <Icon name="Compass" />
                Camera & controls
              </h3>
              <label className="range-setting">
                <span>
                  Camera sensitivity<b>{values.camera}%</b>
                </span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={values.camera}
                  onChange={(e) => set("camera", +e.target.value)}
                />
              </label>
              <div className="control-list">
                <span>
                  Pan the world<kbd>W A S D</kbd>
                </span>
                <span>
                  Rotate camera<kbd>Q / E</kbd>
                </span>
                <span>
                  Zoom<kbd>Scroll</kbd>
                </span>
                <span>
                  Army orders<kbd>Right click</kbd>
                </span>
                <span>
                  Multi-select<kbd>Shift + click</kbd>
                </span>
              </div>
            </section>
            <section>
              <h3>
                <Icon name="Sun" />
                Display & accessibility
              </h3>
              <label className="setting-select">
                <span>
                  Graphics quality
                  <small>
                    Applies resolution, foliage density, and shadows
                  </small>
                </span>
                <select
                  value={values.graphics}
                  onChange={(e) => set("graphics", e.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              {[
                [
                  "showHealth",
                  "Unit health bars",
                  "Always show cohort health on the map",
                ],
                [
                  "reducedMotion",
                  "Reduce motion",
                  "Disable soldier marching animation",
                ],
                [
                  "notifications",
                  "Game notifications",
                  "Show command confirmation messages",
                ],
              ].map(([id, label, desc]) => (
                <div className="setting-row" key={id}>
                  <div>
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </div>
                  <button
                    className={`toggle ${values[id] ? "on" : ""}`}
                    role="switch"
                    aria-checked={values[id]}
                    aria-label={label}
                    onClick={() => set(id, !values[id])}
                  >
                    <i />
                  </button>
                </div>
              ))}
              <label className="setting-select">
                <span>
                  Language
                  <small>More languages planned for future releases</small>
                </span>
                <select
                  value={values.language}
                  onChange={(e) => set("language", e.target.value)}
                >
                  <option>English</option>
                </select>
              </label>
              <div className="notice">
                <Icon name="Info" size={18} />
                Resolution adapts to your browser window. Use your browser’s
                full-screen controls for an immersive view.
              </div>
            </section>
          </div>
          <div className="settings-footer">
            <Button
              icon="RefreshCw"
              onClick={() => setValues({ ...DEFAULT_SETTINGS })}
            >
              Restore defaults
            </Button>
            <Button variant="gold" icon="Save" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="account-settings">
          <section className="account-status">
            <Icon name="ShieldCheck" size={36} />
            <div>
              <h3>
                {user.guest ? "A guest’s journey" : "Your account is protected"}
              </h3>
              <p>
                {user.guest
                  ? "Your empire is saved on this browser’s server session. Create an account to access it from other devices."
                  : `${user.email} · Email verified · Password securely hashed`}
              </p>
            </div>
            {user.guest && (
              <Button variant="gold" onClick={() => open("auth")}>
                Create account
              </Button>
            )}
          </section>
          <div className="notice">
            <Icon name="Info" />
            Two-factor authentication is planned but is not available in this
            foundation. Use a unique, strong password. Sessions expire after 7
            days.
          </div>
          {!user.guest && (
            <form className="password-change" onSubmit={changePassword}>
              <h3>Change password</h3>
              <label>
                Current password
                <input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength="10"
                  autoComplete="new-password"
                  placeholder="10+ characters, uppercase, lowercase, number"
                />
              </label>
              <Button icon="KeyRound" type="submit">
                Update password
              </Button>
            </form>
          )}
          <div className="security-actions">
            <div>
              <h3>Sign out on every device</h3>
              <p>Revoke all active sessions, including this one.</p>
            </div>
            <Button onClick={() => onLogout(true)} icon="LogOut">
              Sign out everywhere
            </Button>
          </div>
          <div className="security-actions danger-zone">
            <div>
              <h3>Delete your account</h3>
              <p>
                Permanently remove your account, settings, and empire. This
                cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              icon="Trash2"
              onClick={() => setDeleting((v) => !v)}
            >
              {deleting ? "Cancel" : "Delete account"}
            </Button>
          </div>
          {deleting && (
            <div className="delete-confirm">
              {!user.guest && (
                <label>
                  Confirm password
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
              )}
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await api("/auth/delete", { password: pw });
                    onLogout(false, true);
                  } catch (e) {
                    toast(e.message, "error");
                  }
                }}
              >
                Yes, permanently delete everything
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
