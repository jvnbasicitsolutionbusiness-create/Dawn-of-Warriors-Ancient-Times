import React, { useState } from "react";
import { DEFAULT_SETTINGS } from "../../shared/catalog";
import { Icon, Button } from "./UI";
import { playSfx, music } from "../game/audio";

export function SettingsPanel({
  settings,
  onSave,
  toast,
  audio,
  setAudio,
}) {
  const [values, setValues] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      await onSave(values);
      toast("Your preferences have been saved in this browser.");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
                onClick={() => {
                  const next = !audio;
                  setAudio(next);
                  music(next, values.music);
                  playSfx("click", values.sound);
                }}
              >
                <i />
              </button>
            </div>
            <label className="setting-row">
              <span>
                Music volume
                <small>Adjust the ambient soundtrack</small>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={values.music}
                aria-label="Music volume"
                onChange={(event) => set("music", Number(event.target.value))}
              />
            </label>
            <label className="setting-row">
              <span>
                Sound effects
                <small>Battle and interface sounds</small>
              </span>
              <button
                className={`toggle ${values.sound ? "on" : ""}`}
                role="switch"
                aria-checked={values.sound}
                aria-label="Sound effects"
                onClick={() => set("sound", !values.sound)}
              >
                <i />
              </button>
            </label>
          </section>
          <section>
            <h3>
              <Icon name="Monitor" />
              Gameplay
            </h3>
            {[
              ["reducedMotion", "Reduce motion", "Disable soldier marching animation"],
              ["notifications", "Game notifications", "Show command confirmation messages"],
            ].map(([id, label, description]) => (
              <div className="setting-row" key={id}>
                <div>
                  <strong>{label}</strong>
                  <small>{description}</small>
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
            <div className="notice">
              <Icon name="Info" size={18} />
              Saves and preferences stay in this browser and are not synced
              between devices.
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
    </>
  );
}
