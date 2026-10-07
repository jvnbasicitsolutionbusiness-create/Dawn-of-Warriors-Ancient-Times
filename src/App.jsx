import React, { useState, useEffect, useRef, useCallback } from "react";
import Battlefield from "./components/Battlefield";
import {
  Icon,
  Button,
  Modal,
  Cost,
  Portrait,
  RESOURCE_ICONS,
} from "./components/UI";
import {
  BuildPanel,
  RecruitPanel,
  ResearchPanel,
  RosterPanel,
} from "./components/EmpirePanels";
import {
  WorldPanel,
  WorkforcePanel,
  StoryPanel,
  ProfilePanel,
  ExtrasPanel,
} from "./components/WorldPanels";
import { SettingsPanel } from "./components/AccountPanels";
import {
  getGame,
  getSettings,
  performAction,
  saveGame,
  saveSettings,
  startGame,
} from "./services/localData";
import { getCurrentLocalProfile } from "./services/localAccounts";
import {
  music,
  chime,
  playSfx,
  setMusicMood,
  setMusicScene,
} from "./game/audio";
import {
  CIVILIZATIONS,
  CHARACTERS,
  BUILDINGS,
  TECHNOLOGIES,
  DEFAULT_SETTINGS,
  WORKER_ROLES,
  commanderFor,
  commanderProfileFor,
} from "../shared/catalog";
const format = (n) => Math.floor(n).toLocaleString("en-US");
const localCommander = {
  id: "local",
  name: "Local Commander",
  username: "Local commander",
  guest: true,
};
const tutorial = [
  [
    "Survey your kingdom",
    "Drag the map to pan. Use the scroll wheel or + / − to zoom. Rotate with Q and E.",
    "Compass",
  ],
  [
    "Choose your warriors",
    "Click a blue cohort or its health bar. Hold Shift while clicking to select several cohorts.",
    "MousePointer2",
  ],
  [
    "Give the order",
    "With a friendly cohort selected, right-click the land to march. On touch screens, use the March command, then tap your destination.",
    "Move",
  ],
  [
    "The art of battle",
    "Move your cohorts toward Riverwatch. Soldiers attack enemies in range automatically. Keep spearmen in front and archers behind.",
    "Swords",
  ],
  [
    "An empire needs provisions",
    "Your capital and farms produce resources every second. Watch the four counters at the top. Build resource buildings to increase production.",
    "Wheat",
  ],
  [
    "Lay a foundation",
    "Open Build, choose Farm, and click an open location near Aurelia. Green placement tiles indicate buildable ground.",
    "Hammer",
  ],
  [
    "Raise a cohort",
    "Open Recruit and train Legionaries. A cohort of six soldiers joins you when training completes.",
    "Users",
  ],
  [
    "Strengthen your settlement",
    "Click your Town Center or another building, then use Upgrade. Completed buildings can be upgraded twice.",
    "Landmark",
  ],
  [
    "Beyond your borders",
    "Defeat Riverwatch’s defenders and move close to the outpost. Your army will bring down its defenses and capture it automatically.",
    "Flag",
  ],
  [
    "Protect your legacy",
    "Use Save in the top-right corner. Your progress is saved automatically in this browser. Clearing browser data removes local saves.",
    "Save",
  ],
];
export default function App() {
  const [user, setUser] = useState(null),
    [game, setGame] = useState(null),
    [settings, setSettings] = useState(DEFAULT_SETTINGS),
    [modal, setModal] = useState(null),
    [selected, setSelected] = useState({
      kind: "army",
      id: "legion",
      ids: ["legion"],
    }),
    [placing, setPlacing] = useState(null),
    [marchMode, setMarchMode] = useState(false),
    [toasts, setToasts] = useState([]),
    [audio, setAudio] = useState(() => {
      try {
        const stored = localStorage.getItem("dow_audio_config");
        if (stored) return JSON.parse(stored).music !== false;
      } catch {}
      return true;
    }),
    [saved, setSaved] = useState(null),
    [error, setError] = useState(""),
    [exited, setExited] = useState(false),
    [ready, setReady] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [booting, setBooting] = useState(true),
    [sequence, setSequence] = useState("boot");
  const mapRef = useRef(),
    gameRef = useRef(),
    toastTimers = useRef([]);
  gameRef.current = game;
  const audioScene = game ? "gameplay" : "lobby";
  const toast = useCallback((text, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((v) => [...v.slice(-2), { id, text, type }]);
    toastTimers.current.push(
      setTimeout(() => setToasts((v) => v.filter((t) => t.id !== id)), 4500),
    );
  }, []);
  async function load(u) {
    setUser(u);
    setSequence("preparing");
    setBooting(true);
    const [g, s] = await Promise.all([getGame(), getSettings()]);
    setError("");
    setGame(g);
    const firstArmy = g.armies.find((army) => !army.enemy);
    const firstWorker =
      g.workers.find((worker) => worker.role === "commander") || g.workers[0];
    setSelected(
      firstArmy
        ? { kind: "army", id: firstArmy.id, ids: [firstArmy.id] }
        : firstWorker
          ? { kind: "worker", id: firstWorker.id }
          : null,
    );
    setSettings(s);
    setExited(false);
    setTimeout(() => {
      setBooting(false);
      setSequence("lobby");
    }, 1200);
  }
  useEffect(() => {
    if (sequence === "boot") {
      const t = setTimeout(() => setSequence("lobby"), 1500);
      return () => clearTimeout(t);
    }
  }, [sequence]);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        if (active) {
          const profile = getCurrentLocalProfile();
          await load(
            profile
              ? {
                  id: profile.id,
                  name: `${profile.firstName} ${profile.lastName}`,
                  username: profile.username,
                  empire: profile.empire,
                  guest: false,
                }
              : localCommander,
          );
        }
      } catch (e) {
        if (active) {
          setError(e.message);
          setBooting(false);
          setSequence("auth");
        }
      }
    }
    init();
    return () => {
      active = false;
      toastTimers.current.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    if (!user || exited) return;
    let alive = true,
      pending = false;
    const t = setInterval(async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const g = getGame();
        if (alive) {
          const prev = gameRef.current;
          if (prev && g.kills > prev.kills) {
            playSfx("clash", settings.sound);
          }
          if (prev && g.victories > prev.victories) {
            playSfx("victory", settings.sound);
          }
          if (prev && !prev.outcome && g.outcome === "victory") {
            playSfx("victory", settings.sound);
          }
          if (prev && !prev.outcome && g.outcome === "defeat") {
            playSfx("defeat", settings.sound);
          }
          if (prev && g.technologies.length > prev.technologies.length) {
            playSfx("research", settings.sound);
          }

          const inBattle = g.armies.some(
            (a) =>
              !a.enemy && (a.status === "Fighting" || a.status === "Engaged"),
          );
          const nearThreat = g.armies.some(
            (a) =>
              !a.enemy &&
              g.armies.some(
                (e) => e.enemy && Math.hypot(a.x - e.x, a.z - e.z) < 14,
              ),
          );
          setMusicMood(
            inBattle || nearThreat
              ? "battle"
              : g.outcome === "victory"
                ? "victory"
                : "ambient",
          );

          setGame(g);
          setError("");
        }
      } catch (e) {
        if (alive) {
          setError(e.message);
          if (e.status === 401) {
            setUser(null);
            setGame(null);
            setExited(true);
          }
        }
      } finally {
        pending = false;
      }
    }, 100);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user, exited, settings.sound]);
  useEffect(() => {
    setMusicScene(audioScene);
    music(audio, settings.music);
    return () => music(false);
  }, [audio, settings.music, audioScene]);
  useEffect(() => {
    const unlockAudio = () => {
      if (audio) music(true, settings.music);
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [audio, settings.music]);
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest(
        "button, .btn, .tab, .chip, [role='button']",
      );
      if (btn && !btn.disabled) {
        playSfx("click", settings.sound);
      }
    };
    window.addEventListener("click", handleGlobalClick, true);
    return () => window.removeEventListener("click", handleGlobalClick, true);
  }, [settings.sound]);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "reduced-motion",
      settings.reducedMotion,
    );
  }, [settings.reducedMotion]);
  const open = useCallback(
    (name) => {
      playSfx("click", settings.sound);
      setModal(name);
      setPlacing(null);
      setMarchMode(false);
      setMobileNav(false);
    },
    [settings.sound],
  );
  const command = useCallback(
    async (type, data = {}) => {
      try {
        const g = performAction(type, data);
        setGame(g);

        if (type === "recruit") playSfx("recruit", settings.sound);
        else if (type === "build") playSfx("build", settings.sound);
        else if (type === "research") playSfx("research", settings.sound);
        else if (type === "move") playSfx("march", settings.sound);
        else if (type === "hold") playSfx("order", settings.sound);
        else if (type === "retreat") playSfx("horn", settings.sound);
        else if (type === "formation") playSfx("order", settings.sound);
        else if (type === "gather")
          playSfx("gather_" + (data.resource || "wood"), settings.sound);
        else if (type === "assign") playSfx("task", settings.sound);
        else if (type === "claim") playSfx("victory", settings.sound);
        else if (type === "upgrade") playSfx("complete", settings.sound);
        else if (type === "repair") playSfx("task", settings.sound);
        else if (type === "trade") playSfx("gather_gold", settings.sound);
        else if (type === "diplomacy") playSfx("horn", settings.sound);
        else if (!["tutorial", "pause"].includes(type))
          playSfx("click", settings.sound);

        if (!["move", "tutorial", "hold", "pause"].includes(type)) {
          if (settings.notifications)
            toast(
              type === "recruit"
                ? "Training order received."
                : type === "research"
                  ? "Your scholars have begun their work."
                  : type === "build"
                    ? "Construction has begun."
                    : type === "claim"
                      ? "Chapter complete. Reward added to your treasury."
                      : type === "retreat"
                        ? "All cohorts are retreating to your capital."
                        : type === "formation"
                          ? `${data.formation.charAt(0).toUpperCase() + data.formation.slice(1)} formation ordered.`
                          : "Order completed.",
            );
        }
        return g;
      } catch (e) {
        toast(e.message, "error");
        return null;
      }
    },
    [settings, toast],
  );
  async function start(civ, mode) {
    try {
      const g = startGame(civ, mode);
      setGame(g);
      setReady(false);
      setSelected(
        mode === "starter"
          ? { kind: "army", id: "legion", ids: ["legion"] }
          : { kind: "worker", id: g.workers[0]?.id },
      );
      setModal(mode === "story" ? "story" : null);
      toast(
        mode === "starter"
          ? `Your standard rises over ${CIVILIZATIONS.find((c) => c.id === civ).capital}.`
          : `${commanderFor(civ).name} begins alone in the ${CIVILIZATIONS.find((c) => c.id === civ).era}.`,
      );
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function save() {
    try {
      const r = saveGame();
      setSaved(r.savedAt);
      toast("Empire saved in this browser.");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function logout() {
    try {
      saveGame();
      setModal(null);
      setUser(null);
      setGame(null);
      setExited(true);
      setAudio(false);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function enterGuest() {
    setBooting(true);
    try {
      await load(localCommander);
    } catch (e) {
      setError(e.message);
      setBooting(false);
    }
  }
  function select(entity, shift) {
    if (!entity) {
      setSelected(null);
      return;
    }
    if (entity.kind === "army" && !entity.enemy) {
      setSelected((old) => {
        const ids =
          shift && old?.kind === "army"
            ? [...new Set([...(old.ids || [old.id]), entity.id])]
            : [entity.id];
        return { ...entity, ids };
      });
    } else setSelected(entity);
  }
  function move(x, z) {
    if (
      !selected ||
      !["army", "worker"].includes(selected.kind) ||
      selected.enemy
    ) {
      toast("Select a friendly unit or your commander first.", "error");
      return;
    }
    command("move", {
      ids:
        selected.kind === "army"
          ? selected.ids || [selected.id]
          : [selected.id],
      x,
      z,
    });
    setMarchMode(false);
  }
  async function place(type, x, z) {
    if (type === "march") {
      move(x, z);
      return;
    }
    const g = await command("build", { building: type, x, z });
    if (g) {
      setPlacing(null);
      setSelected({
        kind: "building",
        id: g.buildings[g.buildings.length - 1].id,
      });
    }
  }
  const titleMap = {
    build: "Build your empire",
    workforce: "Your camp & people",
    recruit: "Rally your warriors",
    research: "The pursuit of knowledge",
    roster: "Warriors of the ancient world",
    world: "Choose your destiny",
    story: "The Eagle & the Ash",
    profile: "A commander’s legacy",
    settings: "Make it your world",
    extras: "The chronicles",
    help: "The commander’s handbook",
    events: "Dispatches from the valley",
    diplomacy: "At the negotiating table",
    quit: "Until the next dawn",
  };
  const close = () => setModal(null);
  if (sequence === "boot" || sequence === "preparing")
    return (
      <div className="boot-screen">
        <div className="boot-emblem">
          <Icon name="Crown" size={50} />
        </div>
        <h1>DAWN OF WARRIORS</h1>
        <span>ANCIENT TIMES</span>
        <div className="boot-progress" />
        <p>
          {sequence === "boot"
            ? "Loading the defense system..."
            : "Preparing the defense system..."}
        </p>
      </div>
    );
  if (!game)
    return (
      <div className="welcome-screen">
        <img
          className="welcome-bg"
          src="./assets/kingdom.jpg"
          alt="Ancient kingdom"
        />
        <div className="welcome-content">
          <Icon name="Crown" size={54} />
          <span className="eyebrow">BUILD AN EMPIRE. LEAVE A LEGACY.</span>
          <h1>
            Dawn of
            <br />
            Warriors
          </h1>
          <h2>ANCIENT TIMES</h2>
          <p>The world remembers those who dared.</p>
          {error && <div className="form-message error">{error}</div>}
          <Button variant="gold" icon="Compass" onClick={enterGuest}>
            Continue to your local campaign
          </Button>
          <small>This campaign is saved locally in this browser.</small>
        </div>
      </div>
    );
  const civ = CIVILIZATIONS.find((c) => c.id === game.civilization),
    commander = commanderProfileFor(game.civilization, game.hero || {}),
    army =
      selected?.kind === "army"
        ? game.armies.find((a) => a.id === selected.id)
        : null,
    character = army ? CHARACTERS.find((c) => c.id === army.character) : null,
    building =
      selected?.kind === "building"
        ? game.buildings.find((b) => b.id === selected.id)
        : null,
    buildingDef = building
      ? BUILDINGS.find((b) => b.id === building.type)
      : null,
    worker =
      selected?.kind === "worker"
        ? (game.workers || []).find((w) => w.id === selected.id)
        : null,
    site =
      selected?.kind === "site"
        ? game.sites.find((s) => s.id === selected.id)
        : null;
  const completed =
    game.mode === "starter"
      ? [
          game.constructed.includes("farm"),
          game.recruited > 0,
          game.sites[0]?.owner === "player",
        ]
      : [
          game.resources.food > 0 || game.resources.wood > 0,
          game.buildings.some((building) => building.type === "hut"),
          (game.workers || []).length > 1,
        ];
  const allArmies = game.armies.filter((a) => !a.enemy);
  const researchProgress = game.research
    ? Math.max(0, game.research.readyAt - game.tick)
    : 0;
  return (
    <div className={`app-shell ${mobileNav ? "nav-open" : ""}`}>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => open("menu")}
          aria-label="Open main menu"
        >
          <div className="brand-mark">
            <Icon name="Crown" size={30} />
            <span>W</span>
          </div>
          <span>
            DAWN OF
            <br />
            <b>WARRIORS</b>
          </span>
          <small>ANCIENT TIMES</small>
        </button>
        <div className="sidebar-separator" />
        <nav>
          <button
            className={!modal ? "active" : ""}
            onClick={close}
            title="Empire overview"
          >
            <Icon name="Landmark" />
            <span>Empire</span>
          </button>
          {game.mode !== "starter" && (
            <button
              className={modal === "workforce" ? "active" : ""}
              onClick={() => open("workforce")}
            >
              <Icon name="Users" />
              <span>Camp & people</span>
            </button>
          )}
          <button
            className={modal === "world" ? "active" : ""}
            onClick={() => open("world")}
          >
            <Icon name="Globe" />
            <span>Campaign</span>
          </button>
          <button
            className={modal === "story" ? "active" : ""}
            onClick={() => open("story")}
          >
            <Icon name="BookOpen" />
            <span>Story mode</span>
          </button>
          <button
            className={modal === "roster" ? "active" : ""}
            onClick={() => open("roster")}
          >
            <Icon name="Users" />
            <span>Warriors</span>
          </button>
          <button
            className={modal === "research" ? "active" : ""}
            onClick={() => open("research")}
          >
            <Icon name="ScrollText" />
            <span>Research</span>
          </button>
          <button
            className={modal === "extras" ? "active" : ""}
            onClick={() => open("extras")}
          >
            <Icon name="Compass" />
            <span>Chronicles</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => open("help")}>
            <Icon name="HelpCircle" />
            <span>Guide</span>
          </button>
          <button onClick={() => open("settings")}>
            <Icon name="Settings" />
            <span>Settings</span>
          </button>
          <button onClick={() => open("quit")} title="Save and quit">
            <Icon name="LogOut" />
            <span>Quit</span>
          </button>
          <small>v.0.1.0</small>
        </div>
      </aside>
      <main className="workspace">
        <header className="resourcebar">
          <button
            className="mobile-menu icon-btn"
            onClick={() => setMobileNav((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Icon name="Menu" />
          </button>
          <button
            className="civilization-identity"
            onClick={() => open("world")}
          >
            <div className="civ-icon">
              <Icon name="Crown" size={25} />
            </div>
            <div>
              <span>{civ.name}</span>
              <small>{civ.era.toUpperCase()}</small>
            </div>
            <Icon name="ChevronDown" size={14} />
          </button>
          <div className="resources">
            {Object.entries(game.resources).map(([r, v]) => (
              <div
                className={`resource ${r}`}
                key={r}
                title={`${r}: ${format(v)} / ${game.storage} capacity · ${game.rates[r].toFixed(1)} per second`}
              >
                <div className="resource-icon">
                  <Icon name={RESOURCE_ICONS[r]} size={24} />
                </div>
                <div>
                  <span className="resource-name">{r}</span>
                  <strong>{format(v)}</strong>
                </div>
                <small>+{(game.rates[r] || 0).toFixed(1)}/s</small>
              </div>
            ))}
          </div>
          <button
            className="population"
            onClick={() => open("recruit")}
            title="Population / capacity"
          >
            <Icon name="Users" />
            <div>
              <small>POPULATION</small>
              <strong>
                {game.population}
                <span> / {game.capacity}</span>
              </strong>
            </div>
          </button>
          <div className="top-account">
            <button
              className={`icon-btn ${audio ? "gold-text" : ""}`}
              title={audio ? "Mute ambient music" : "Enable ambient music"}
              aria-label={audio ? "Mute music" : "Enable music"}
              onClick={() =>
                setAudio((v) => {
                  const next = !v;
                  try {
                    localStorage.setItem(
                      "dow_audio_config",
                      JSON.stringify({
                        music: next,
                        sfx: true,
                        volume: settings.music,
                      }),
                    );
                  } catch {}
                  return next;
                })
              }
            >
              <Icon name={audio ? "Volume2" : "VolumeX"} size={19} />
            </button>
            <button
              className="icon-btn"
              title="System settings"
              aria-label="System settings"
              onClick={() => open("settings")}
            >
              <Icon name="Settings" size={19} />
            </button>
            <button
              className="icon-btn notification-btn"
              onClick={() => open("events")}
              title="Kingdom dispatches"
            >
              <Icon name="Bell" size={19} />
              <i />
            </button>
            <button
              className="account-avatar"
              onClick={() => open("profile")}
              aria-label="Character profile"
            >
              <Portrait character={{ ...commander, class: "Commander" }} />
              <span>
                {1 +
                  Math.floor(
                    (game.kills * 50 +
                      game.victories * 200 +
                      game.technologies.length * 80) /
                      300,
                  )}
              </span>
            </button>
          </div>
        </header>
        <section className="commandbar">
          <div>
            <div className="breadcrumb">
              <span>{game.mode === "story" ? "STORY MODE" : "CAMPAIGN"}</span>
              <Icon name="ChevronRight" size={10} />
              {civ.region.toUpperCase()}
              <span className="breadcrumb-dot">•</span>
              <span>THE AURELIAN VALLEY</span>
            </div>
            <h1>
              A new dawn awaits<span>.</span>
            </h1>
            <p>Build your kingdom. Lead your people. Shape history.</p>
          </div>
          <div className="commandbar-right">
            <span className="live-status">
              <i />
              {game.paused
                ? "KINGDOM PAUSED"
                : game.outcome
                  ? "CAMPAIGN COMPLETE"
                  : "YOUR EMPIRE IS ALIVE"}
            </span>
            <button className="subtle-button" onClick={save}>
              <Icon name="Save" size={16} />
              <span>{saved ? "Progress saved" : "Save progress"}</span>
            </button>
            <button
              className="icon-btn pause-button"
              title={game.paused ? "Resume simulation" : "Pause simulation"}
              onClick={() => command("pause")}
            >
              <Icon name={game.paused ? "Play" : "Pause"} size={17} />
            </button>
          </div>
        </section>
        <section className="map-container">
          <Battlefield
            ref={mapRef}
            game={game}
            settings={settings}
            selected={selected}
            placing={placing || (marchMode ? "march" : null)}
            onSelect={select}
            onMove={move}
            onBuild={place}
            onReady={() => setReady(true)}
          />
          {!ready && (
            <div className="map-loading">
              <Icon name="Compass" size={35} />
              <span>Surveying the valley…</span>
            </div>
          )}
          <div className="map-vignette" />
          <div className="map-top-left">
            <div className="map-view-switch">
              <button className="active" onClick={() => mapRef.current?.home()}>
                <Icon name="Landmark" size={15} />
                Kingdom view
              </button>
              <button onClick={() => open("world")}>
                <Icon name="Globe" size={15} />
                World map
                <Icon name="ArrowUpRight" size={12} />
              </button>
            </div>
            <div className="empire-summary">
              <div className="eyebrow">
                <span className="tiny-diamond" />
                {game.mode !== "starter" &&
                !game.buildings.some((b) => b.id === "capital")
                  ? "YOUR FIRST CAMP"
                  : "YOUR EMPIRE"}
              </div>
              <div className="capital-heading">
                <h2>
                  {game.mode !== "starter" &&
                  !game.buildings.some((b) => b.id === "capital")
                    ? "The Forest"
                    : civ.capital}
                </h2>
                <span>
                  {game.mode !== "starter" &&
                  !game.buildings.some((b) => b.id === "capital")
                    ? "FOUNDING CAMP"
                    : "CAPITAL"}
                </span>
              </div>
              <p>
                {game.mode !== "starter" &&
                !game.buildings.some((b) => b.id === "capital")
                  ? "Your commander stands alone. No supplies. Everything must be earned."
                  : "The heart of a rising civilization."}
              </p>
              <div className="empire-metrics">
                <div>
                  <Icon name="Swords" size={17} />
                  <strong>{format(game.power)}</strong>
                  <span>Power</span>
                </div>
                <div>
                  <Icon name="Flag" size={17} />
                  <strong>{game.territories}</strong>
                  <span>Territories</span>
                </div>
                <div>
                  <Icon name="Shield" size={17} />
                  <strong>{allArmies.length}</strong>
                  <span>Cohorts</span>
                </div>
              </div>
              <button
                className="empire-detail-link"
                onClick={() => {
                  if (game.buildings.some((b) => b.id === "capital")) {
                    setSelected({ kind: "building", id: "capital" });
                    mapRef.current?.focus(-15, 7);
                  } else {
                    setSelected({ kind: "worker", id: game.workers[0]?.id });
                    mapRef.current?.focus(
                      game.workers[0]?.x ?? -15,
                      game.workers[0]?.z ?? 7,
                    );
                    open("workforce");
                  }
                }}
              >
                {game.buildings.some((b) => b.id === "capital")
                  ? "Manage settlement"
                  : "Manage your camp"}{" "}
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
          <div className="map-top-right">
            <div className="season-chip">
              <Icon name="Sun" size={17} />
              <span>{civ.era || "The age of beginnings"}</span>
              <span className="season-year">
                {(game.timeline || { date: "400 BCE", clock: "08:00" }).date}
                <small>
                  {" "}
                  ·{" "}
                  {(game.timeline || { date: "400 BCE", clock: "08:00" }).clock}
                </small>
              </span>
            </div>
            <button className="mobile-objective" onClick={() => open("help")}>
              <Icon name="Flag" size={14} />
              <span>Commander’s guide</span>
              <Icon name="ArrowUpRight" size={12} />
            </button>
            <section className="objectives">
              <div className="objective-heading">
                <span className="objective-emblem">
                  <Icon name="Flag" size={17} />
                </span>
                <div>
                  <span className="eyebrow">YOUR NEXT CHAPTER</span>
                  <h3>The path to an empire</h3>
                </div>
                <span className="objective-counter">
                  {completed.filter(Boolean).length}/3
                </span>
              </div>
              <div className="objective-list">
                {(game.mode !== "starter"
                  ? [
                      [
                        "Gather food & timber",
                        "Survive the first days",
                        "workforce",
                      ],
                      [
                        "Build a mini-house",
                        "Make room for new people",
                        "build",
                      ],
                      [
                        "Hire your first villagers",
                        "Grow beyond one worker",
                        "workforce",
                      ],
                    ]
                  : [
                      ["Build a new farm", "Grow your economy", "build"],
                      ["Recruit a cohort", "Strengthen your army", "recruit"],
                      ["Capture Riverwatch", "Expand your borders", "target"],
                    ]
                ).map(([title, sub, target], i) => (
                  <button
                    key={title}
                    onClick={() =>
                      target === "target"
                        ? mapRef.current?.focus(26, 1)
                        : open(target)
                    }
                  >
                    <span
                      className={`objective-check ${completed[i] ? "done" : ""}`}
                    >
                      {completed[i] ? <Icon name="Check" size={11} /> : null}
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{sub}</small>
                    </span>
                    <Icon name="ChevronRight" size={13} />
                  </button>
                ))}
              </div>
              <button className="objective-guide" onClick={() => open("help")}>
                View commander’s guide <Icon name="ArrowUpRight" size={13} />
              </button>
            </section>
            {game.research && (
              <button
                className="research-notice"
                onClick={() => open("research")}
              >
                <Icon name="BookOpen" size={18} />
                <div>
                  <strong>
                    {TECHNOLOGIES.find((t) => t.id === game.research.id).name}
                  </strong>
                  <small>Researching · {researchProgress}s remaining</small>
                </div>
                <span className="spinner" />
              </button>
            )}
          </div>
          <div className="map-center-top">
            <div className="map-compass">
              <span>N</span>
              <Icon name="Compass" size={30} />
            </div>
          </div>
          {(placing || marchMode) && (
            <div className="placement-hint">
              <Icon name={placing ? "Hammer" : "Move"} size={18} />
              <span>
                {placing
                  ? `Place ${BUILDINGS.find((b) => b.id === placing).name} within your borders`
                  : selected?.kind === "worker"
                    ? "Tap the map to move your selected villager or commander"
                    : "Tap the map to order your selected cohorts to march"}
              </span>
              <button
                onClick={() => {
                  setPlacing(null);
                  setMarchMode(false);
                }}
              >
                <Icon name="X" size={17} />
              </button>
            </div>
          )}
          {game.paused && (
            <div className="pause-label">
              <Icon name="Pause" size={18} />
              KINGDOM PAUSED
              <Button variant="small" onClick={() => command("pause")}>
                Resume
              </Button>
            </div>
          )}
          {game.outcome && (
            <div className="outcome-banner">
              <Icon
                name={game.outcome === "victory" ? "Crown" : "Shield"}
                size={32}
              />
              <h2>
                {game.outcome === "victory"
                  ? "An empire is born."
                  : "Your standard has fallen."}
              </h2>
              <p>
                {game.outcome === "victory"
                  ? "The valley is united under your banner."
                  : "History has not heard the last of you."}
              </p>
              <Button variant="gold" onClick={() => open("world")}>
                Begin a new chapter
              </Button>
            </div>
          )}
          <div className="map-bottom-left">
            <div className="map-legend">
              <span>
                <i className="friendly-dot" />
                Your empire
              </span>
              <span>
                <i className="enemy-dot" />
                Rival kingdom
              </span>
              <span>
                <i className="neutral-dot" />
                Unclaimed
              </span>
            </div>
            <span className="map-help">
              <Icon name="MousePointer2" size={12} /> Drag to pan<span>·</span>
              Scroll to zoom<span>·</span>Right-click to move selected units
            </span>
          </div>
          <div className="map-bottom-right">
            <div className="map-controls">
              <button
                onClick={() => mapRef.current?.zoom(0.15)}
                title="Zoom in"
              >
                <Icon name="Plus" size={17} />
              </button>
              <button
                onClick={() => mapRef.current?.zoom(-0.15)}
                title="Zoom out"
              >
                <Icon name="Minus" size={17} />
              </button>
              <span />
              <button
                onClick={() => mapRef.current?.rotate(0.45)}
                title="Rotate camera"
              >
                <Icon name="RotateCw" size={17} />
              </button>
              <button
                onClick={() => mapRef.current?.home()}
                title="Focus on capital"
              >
                <Icon name="Maximize2" size={17} />
              </button>
            </div>
            <div
              className="minimap"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                mapRef.current?.focus(
                  ((e.clientX - r.left) / r.width) * 100 - 50,
                  ((e.clientY - r.top) / r.height) * 80 - 40,
                );
              }}
              role="button"
              tabIndex="0"
              aria-label="Minimap: click to move camera, Enter to focus capital"
              onKeyDown={(e) => e.key === "Enter" && mapRef.current?.home()}
            >
              <svg viewBox="0 0 200 130">
                <defs>
                  <pattern
                    id="mini-texture"
                    width="15"
                    height="13"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M2 8L6 2 10 8Z" fill="#47654f" opacity=".4" />
                  </pattern>
                </defs>
                <rect width="200" height="130" fill="#778367" />
                <rect width="200" height="130" fill="url(#mini-texture)" />
                <path
                  d="M120 -10Q103 20 122 43T128 95 121 145"
                  fill="none"
                  stroke="#8db6b3"
                  strokeWidth="9"
                />
                <path
                  d="M43 74L70 76 104 68 151 66 168 19"
                  stroke="#b7b391"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="46"
                  y="54"
                  width="36"
                  height="31"
                  stroke="#cac9a0"
                  strokeWidth="1"
                  fill="#527d7d"
                  opacity=".8"
                />
                {game.sites.map((s) => (
                  <rect
                    key={s.id}
                    x={(s.x + 50) * 2 - 3}
                    y={(s.z + 40) * 1.625 - 3}
                    width="6"
                    height="6"
                    fill={
                      s.owner === "enemy"
                        ? "#c77560"
                        : s.owner === "player"
                          ? "#b7e4e0"
                          : "#dbc694"
                    }
                  />
                ))}
                {game.armies.map((a) => (
                  <circle
                    key={a.id}
                    cx={(a.x + 50) * 2}
                    cy={(a.z + 40) * 1.625}
                    r="2"
                    fill={a.enemy ? "#d7866c" : "#d8efde"}
                  />
                ))}
                <rect
                  x="37"
                  y="39"
                  width="110"
                  height="65"
                  fill="none"
                  stroke="#eee7c5"
                  strokeWidth="1"
                  opacity=".7"
                />
              </svg>
              <div className="minimap-title">
                <Icon name="Compass" size={11} />
                <span>THE AURELIAN VALLEY</span>
                <Icon name="ArrowUpRight" size={11} />
              </div>
            </div>
          </div>
        </section>
        <footer className="command-dock">
          <section className="selection-panel">
            {army ? (
              <>
                <button
                  className="selected-portrait"
                  onClick={() => open("roster")}
                >
                  <Portrait
                    character={
                      character?.class === "Infantry" ? undefined : character
                    }
                  />
                  <span>{army.level}</span>
                </button>
                <div className="selection-info">
                  <span className="eyebrow">
                    {army.enemy
                      ? "RIVAL COHORT"
                      : (selected.ids?.length || 1) > 1
                        ? `${selected.ids.length} COHORTS SELECTED`
                        : "YOUR VANGUARD"}
                  </span>
                  <h3>
                    {army.enemy
                      ? character.name
                      : character.class === "Infantry" && civ.id === "aurelia"
                        ? "Aurelian Legion"
                        : character.title}
                    <span>
                      {army.enemy ? "ENEMY" : army.status.toUpperCase()}
                    </span>
                  </h3>
                  <div className="health-row">
                    <Icon name="Heart" size={12} />
                    <div>
                      <i
                        style={{ width: `${(army.hp / army.maxHp) * 100}%` }}
                      />
                    </div>
                    <span>
                      {format(army.hp)} / {army.maxHp}
                    </span>
                  </div>
                  <div className="selected-stats">
                    <span>
                      <Icon name="Sword" size={12} />
                      {character.attack}
                    </span>
                    <span>
                      <Icon name="Shield" size={12} />
                      {character.defense}
                    </span>
                    <span>
                      <Icon name="Users" size={12} />
                      {army.count} soldiers
                    </span>
                    <span className="unit-xp">{army.xp} XP</span>
                  </div>
                </div>
              </>
            ) : building ? (
              <>
                <div className="selected-building-icon">
                  <Icon name={buildingDef.icon} size={35} />
                </div>
                <div className="selection-info">
                  <span className="eyebrow">
                    {building.id === "capital"
                      ? civ.capital
                      : "YOUR SETTLEMENT"}{" "}
                    · LEVEL {building.level}
                  </span>
                  <h3>{buildingDef.name}</h3>
                  <div className="health-row">
                    <Icon name="Heart" size={12} />
                    <div>
                      <i
                        style={{
                          width: `${(building.hp / building.maxHp) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{format(building.hp)}</span>
                  </div>
                  <small className="muted">
                    {building.readyAt
                      ? `Under construction · ${building.readyAt - game.tick}s`
                      : buildingDef.description}
                  </small>
                </div>
              </>
            ) : worker ? (
              <>
                <div className="selected-building-icon">
                  <Icon
                    name={WORKER_ROLES[worker.role]?.icon || "Pickaxe"}
                    size={32}
                  />
                </div>
                <div className="selection-info">
                  <span className="eyebrow">
                    {WORKER_ROLES[worker.role]?.name || "POOR WORKER"}
                  </span>
                  <h3>{worker.name}</h3>
                  <div className="health-row">
                    <Icon name="Heart" size={12} />
                    <div>
                      <i
                        style={{
                          width: `${(worker.hp / worker.maxHp) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{worker.hp}</span>
                  </div>
                  {worker.role !== "commander" && (
                    <button
                      className="text-btn gold-text"
                      onClick={() => open("workforce")}
                    >
                      Assign a role <Icon name="ArrowRight" size={13} />
                    </button>
                  )}
                </div>
              </>
            ) : site ? (
              <>
                <div className="selected-building-icon">
                  <Icon name="Castle" size={35} />
                </div>
                <div className="selection-info">
                  <span className="eyebrow">
                    {site.owner === "enemy"
                      ? "RIVAL STRONGHOLD"
                      : site.owner === "player"
                        ? "YOUR TERRITORY"
                        : "UNCLAIMED TERRITORY"}
                  </span>
                  <h3>{site.name}</h3>
                  <div className="health-row">
                    <Icon name="Heart" size={12} />
                    <div>
                      <i
                        style={{ width: `${(site.hp / site.maxHp) * 100}%` }}
                      />
                    </div>
                    <span>{site.hp}</span>
                  </div>
                  <small className="muted">
                    {site.owner === "player"
                      ? "Your banner flies above these walls."
                      : `Capture reward · ${site.reward} gold`}
                  </small>
                </div>
              </>
            ) : (
              <>
                <div className="selected-building-icon">
                  <Icon name="MousePointer2" size={32} />
                </div>
                <div className="selection-info">
                  <span className="eyebrow">AWAITING YOUR ORDERS</span>
                  <h3>The world is yours</h3>
                  <p>Select a cohort, building, or settlement.</p>
                </div>
              </>
            )}
          </section>
          <div className="military-actions">
            {building ? (
              <>
                <button
                  disabled={building.level >= 3 || !!building.readyAt}
                  onClick={() => command("upgrade", { id: building.id })}
                >
                  <Icon name="ChevronsUp" />
                  <span>Upgrade</span>
                </button>
                <button
                  disabled={building.hp >= building.maxHp || !!building.readyAt}
                  onClick={() => command("repair", { id: building.id })}
                >
                  <Icon name="ShieldPlus" />
                  <span>Repair</span>
                </button>
                <button
                  onClick={() =>
                    building.type === "market"
                      ? command("trade")
                      : open("build")
                  }
                >
                  <Icon name={building.type === "market" ? "Store" : "Plus"} />
                  <span>{building.type === "market" ? "Trade" : "Expand"}</span>
                </button>
              </>
            ) : worker ? (
              <>
                <button
                  onClick={() => {
                    setMarchMode(true);
                    setPlacing(null);
                    playSfx("order", settings.sound);
                  }}
                  title="Choose a destination for this person"
                >
                  <Icon name="Move" />
                  <span>Move</span>
                </button>
                <button
                  onClick={() => command("gather", { resource: "wood" })}
                  title="Chop timber (+4 wood)"
                >
                  <Icon name="Trees" />
                  <span>Chop Wood</span>
                </button>
                <button
                  onClick={() => command("gather", { resource: "stone" })}
                  title="Quarry stone (+3 stone)"
                >
                  <Icon name="Mountain" />
                  <span>Mine Stone</span>
                </button>
                <button
                  onClick={() => command("gather", { resource: "gold" })}
                  title="Mine gold"
                >
                  <Icon name="Coins" />
                  <span>Mine Gold</span>
                </button>
                <button
                  onClick={() => command("gather", { resource: "food" })}
                  title="Harvest food & berries"
                >
                  <Icon name="Wheat" />
                  <span>Forage Food</span>
                </button>
                <button
                  onClick={() => open("build")}
                  title="Construct new building"
                >
                  <Icon name="Hammer" />
                  <span>Build</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelected({
                      kind: "army",
                      id: allArmies[0]?.id,
                      ids: allArmies.map((a) => a.id),
                    });
                    playSfx("select", settings.sound);
                    toast("All friendly cohorts selected.");
                  }}
                  disabled={!allArmies.length}
                  title="Select all friendly armies"
                >
                  <Icon name="Users" />
                  <span>Select all</span>
                </button>
                <button
                  onClick={() => {
                    if (!army || army.enemy) {
                      toast("Select your cohort first.", "error");
                      return;
                    }
                    setMarchMode(true);
                    setPlacing(null);
                    playSfx("order", settings.sound);
                  }}
                >
                  <Icon name="Move" />
                  <span>March</span>
                </button>
                <button
                  onClick={() =>
                    command("hold", { ids: selected?.ids || [selected?.id] })
                  }
                  disabled={!army || army.enemy}
                >
                  <Icon name="Shield" />
                  <span>Hold</span>
                </button>
                <button
                  onClick={() => command("retreat")}
                  disabled={!allArmies.length}
                >
                  <Icon name="Flag" />
                  <span>Retreat</span>
                </button>
              </>
            )}
          </div>
          <div className="formation-control">
            <span>FORMATION</span>
            <select
              aria-label="Army formation"
              value={game.formation}
              onChange={(e) =>
                command("formation", { formation: e.target.value })
              }
            >
              {["line", "defensive", "spear", "cavalry", "archer", "siege"].map(
                (f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)} formation
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="empire-actions">
            <button className="dock-build" onClick={() => open("build")}>
              <Icon name="Hammer" size={23} />
              <div>
                <strong>Build</strong>
                <span>Shape your empire</span>
              </div>
              <kbd>B</kbd>
            </button>
            <button className="dock-recruit" onClick={() => open("recruit")}>
              <Icon name="Swords" size={23} />
              <div>
                <strong>Recruit</strong>
                <span>Raise your army</span>
              </div>
              <kbd>R</kbd>
            </button>
          </div>
        </footer>
        <div className="statusbar">
          <div>
            <span className="connection-dot" />
            {error ? "LOCAL SAVE ISSUE" : "LOCAL CAMPAIGN"}
            <span className="status-divider">|</span>
            <span>
              {user.guest
                ? "Saved in this browser · not synced between devices"
                : `Local banner: ${user.username}`}
            </span>
          </div>
          <div>
            <button onClick={() => open("diplomacy")}>
              <Icon name="Flag" size={11} />
              {game.diplomacy === "truce"
                ? `Truce · ${game.truceUntil - game.tick}s`
                : "Diplomacy"}
            </button>
            <span className="status-divider">|</span>
            <span>Browser autosave enabled</span>
            <Icon name="CheckCheck" size={13} />
          </div>
        </div>
      </main>
      <Shortcuts
        open={open}
        save={save}
        modal={modal}
        clear={() => {
          setPlacing(null);
          setMarchMode(false);
        }}
      />
      {modal && modal !== "menu" && (
        <Modal
          title={titleMap[modal] || "Your kingdom"}
          kicker={
            modal === "world"
              ? "THE WORLD IS YOURS"
              : modal === "story"
                ? "STORY MODE · ORIGINAL SAGA"
                : modal === "workforce"
                  ? "THE FIRST SETTLEMENT"
                  : modal === "build"
                    ? "SETTLEMENT & ECONOMY"
                    : modal === "recruit"
                      ? "MILITARY COMMAND"
                      : "DAWN OF WARRIORS · ANCIENT TIMES"
          }
          onClose={close}
          wide={!["quit", "help", "events", "diplomacy"].includes(modal)}
          className={["auth", "reset"].includes(modal) ? "auth-modal" : ""}
        >
          {modal === "build" && (
            <BuildPanel
              game={game}
              command={command}
              onPlace={(type) => {
                setPlacing(type);
                close();
              }}
            />
          )}
          {modal === "recruit" && (
            <RecruitPanel game={game} command={command} />
          )}
          {modal === "research" && (
            <ResearchPanel game={game} command={command} />
          )}
          {modal === "roster" && <RosterPanel game={game} command={command} />}
          {modal === "workforce" && (
            <WorkforcePanel game={game} command={command} />
          )}
          {modal === "world" && <WorldPanel game={game} onStart={start} />}
          {modal === "story" && (
            <StoryPanel game={game} command={command} onStart={start} />
          )}
          {modal === "profile" && (
            <ProfilePanel game={game} user={user} open={open} />
          )}
          {modal === "extras" && <ExtrasPanel game={game} open={open} />}
          {modal === "settings" && (
            <SettingsPanel
              settings={settings}
              onSave={async (v) => {
                const s = saveSettings(v);
                setSettings(s);
              }}
              toast={toast}
              audio={audio}
              setAudio={setAudio}
            />
          )}
          {modal === "quit" && (
            <div className="quit-content">
              <div className="quit-emblem">
                <Icon name="Sun" size={46} />
              </div>
              <h3>Your kingdom will await your return.</h3>
              <p>Your progress is saved in this browser automatically.</p>
              <div className="notice">
                <Icon name="Info" />
                Local saves are not synced between devices. Clearing browser
                data removes this campaign.
              </div>
              <div className="quit-actions">
                <Button onClick={close}>Stay in the valley</Button>
                <Button variant="gold" icon="Save" onClick={() => logout()}>
                  Save & return to title
                </Button>
              </div>
            </div>
          )}
          {modal === "events" && (
            <div className="events-list">
              {game.events.map((e) => (
                <article key={e.id}>
                  <span className={`event-icon ${e.type}`}>
                    <Icon
                      name={
                        e.type === "danger"
                          ? "Swords"
                          : e.type === "success"
                            ? "CheckCircle2"
                            : "ScrollText"
                      }
                    />
                  </span>
                  <div>
                    <p>{e.text}</p>
                    <time>
                      {new Date(e.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
          {modal === "diplomacy" && (
            <div className="diplomacy-content">
              <div className="rival-banner">
                <Icon name="Swords" size={40} />
                <span className="eyebrow">THE IRONBOUND CLANS</span>
                <h3>
                  {game.diplomacy === "truce"
                    ? "A fragile peace"
                    : "A kingdom at war"}
                </h3>
                <p>
                  “Gold has a louder voice than honor, commander. For a price,
                  our blades can rest.”
                </p>
                <small>— Ulric Blackthorn, Lord of the Iron Citadel</small>
              </div>
              <div className="diplomacy-offer">
                <Icon name="Flag" />
                <div>
                  <strong>Negotiate a temporary truce</strong>
                  <p>
                    All fighting and raids stop for 90 seconds. Use the peace to
                    build and recruit.
                  </p>
                </div>
                <Cost cost={{ gold: 200 }} resources={game.resources} />
              </div>
              <Button
                variant="gold full"
                disabled={
                  game.diplomacy === "truce" || game.resources.gold < 200
                }
                onClick={() => command("diplomacy")}
              >
                {game.diplomacy === "truce"
                  ? `Truce active · ${game.truceUntil - game.tick} seconds`
                  : "Send an envoy · 200 gold"}
              </Button>
            </div>
          )}
          {modal === "help" && (
            <div className="tutorial-content">
              <div className="tutorial-progress">
                {tutorial.map((t, i) => (
                  <span
                    className={i <= game.tutorial ? "active" : ""}
                    key={t[0]}
                  />
                ))}
              </div>
              {game.tutorial < 10 ? (
                <>
                  <span className="eyebrow">
                    LESSON {game.tutorial + 1} OF 10
                  </span>
                  <div className="tutorial-icon">
                    <Icon name={tutorial[game.tutorial][2]} size={42} />
                  </div>
                  <h3>{tutorial[game.tutorial][0]}</h3>
                  <p>{tutorial[game.tutorial][1]}</p>
                  <div className="notice">
                    <Icon name="Info" size={17} />
                    Close this guide to try it on the map. Your lesson is
                    remembered when you return.
                  </div>
                  <div className="tutorial-actions">
                    <Button onClick={close}>Try it in the kingdom</Button>
                    <Button
                      variant="gold"
                      icon="ArrowRight"
                      onClick={() => command("tutorial")}
                    >
                      Next lesson
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="tutorial-icon">
                    <Icon name="Award" size={45} />
                  </div>
                  <h3>Your legend starts here.</h3>
                  <p>
                    You know the fundamentals. Explore, experiment, and lead
                    your people. Story Mode offers three guided chapters and
                    rewards.
                  </p>
                  <Button variant="gold" onClick={() => open("story")}>
                    Explore the story
                  </Button>
                </>
              )}
            </div>
          )}
        </Modal>
      )}
      {modal === "menu" && (
        <div className="main-menu">
          <img
            className="menu-bg"
            src="./assets/kingdom.jpg"
            alt="The ancient kingdom of Aurelia"
          />
          <div className="menu-shade" />
          <button
            className="menu-close icon-btn"
            onClick={close}
            aria-label="Return to game"
          >
            <Icon name="X" />
          </button>
          <div className="menu-content">
            <Icon name="Crown" size={45} />
            <span className="eyebrow">BUILD AN EMPIRE. LEAVE A LEGACY.</span>
            <h1>
              Dawn of
              <br />
              Warriors
            </h1>
            <h2>ANCIENT TIMES</h2>
            <nav>
              {[
                ["RESUME EMPIRE", "resume", "Play"],
                ["CAMPAIGN", "world", "Globe"],
                ...(game.mode !== "starter"
                  ? [["CAMP & PEOPLE", "workforce", "Users"]]
                  : []),
                ["STORY MODE", "story", "BookOpen"],
                ["CHARACTER PROFILE", "profile", "User"],
                ["SETTINGS", "settings", "Settings"],
                ["EXTRAS", "extras", "Compass"],
                ["QUIT", "quit", "LogOut"],
              ].map(([label, target, icon], i) => (
                <button
                  key={label}
                  onClick={() => (target === "resume" ? close() : open(target))}
                >
                  <span className="menu-index">0{i + 1}</span>
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                  <Icon name="ArrowRight" size={17} />
                </button>
              ))}
            </nav>
            <button className="return-game" onClick={close}>
              <span className="connection-dot" />
              Return to your empire
              <Icon name="ArrowRight" size={15} />
            </button>
            <small>
              AN ORIGINAL ANCIENT-WORLD STRATEGY EXPERIENCE · v0.1.0
            </small>
          </div>
          <div className="menu-quote">
            <span>THE AURELIAN CHRONICLES</span>
            <p>
              “An empire is not built in a day.
              <br />
              But every empire begins with one.”
            </p>
          </div>
        </div>
      )}
      <div className="toasts" role="status">
        {toasts.map((t) => (
          <div className={`toast ${t.type}`} key={t.id}>
            <Icon
              name={t.type === "error" ? "TriangleAlert" : "CheckCircle2"}
              size={18}
            />
            <span>{t.text}</span>
            <button
              onClick={() => setToasts((v) => v.filter((i) => i.id !== t.id))}
              aria-label="Dismiss notification"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <div className="connection-error">
          <Icon name="TriangleAlert" size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
function Shortcuts({ open, save, modal, clear }) {
  useEffect(() => {
    const key = (e) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
        e.ctrlKey ||
        e.metaKey ||
        modal
      )
        return;
      if (e.key.toLowerCase() === "b") open("build");
      if (e.key.toLowerCase() === "r") open("recruit");
      if (e.key === "Escape") clear();
      if (e.key === "F5") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, save, modal, clear]);
  return null;
}
