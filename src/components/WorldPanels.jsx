import React, { useState, useEffect } from "react";
import {
  CIVILIZATIONS,
  STORY,
  CHARACTERS,
  TECHNOLOGIES,
  WORKER_ROLES,
  eraKitFor,
} from "../../shared/catalog";
import { Icon, Button, Portrait } from "./UI";
import { api } from "../services/api";
export function WorldPanel({ game, onStart }) {
  const [selected, setSelected] = useState(game.civilization),
    [mode, setMode] = useState("campaign"),
    [confirm, setConfirm] = useState(false);
  const civ = CIVILIZATIONS.find((c) => c.id === selected);
  const modes = [
    {
      id: "starter",
      title: "Frontier Skirmish",
      description: "Start with an army and learn the battlefield by doing.",
      icon: "Swords",
    },
    {
      id: "campaign",
      title: "Found a Realm",
      description: "Build a settlement from one worker and shape its future.",
      icon: "Landmark",
    },
    {
      id: "story",
      title: "The Eagle & the Ash",
      description: "Play the original, chapter-led story campaign.",
      icon: "BookOpen",
    },
  ];
  return (
    <>
      <div className="panel-intro">
        <p>A world divided. An empire waiting to be born.</p>
        <span>
          <Icon name="Globe" size={15} /> Three regions to explore
        </span>
      </div>
      <div className="world-atlas">
        <svg
          viewBox="0 0 900 350"
          role="img"
          aria-label="World map showing playable Europe, Asia, and Middle East, with Africa and Australia locked"
        >
          <defs>
            <pattern
              id="grid"
              width="45"
              height="45"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M45 0H0V45"
                fill="none"
                stroke="#84937b"
                strokeWidth=".4"
                opacity=".3"
              />
            </pattern>
            <radialGradient id="sea">
              <stop stopColor="#334843" />
              <stop offset="1" stopColor="#182b2c" />
            </radialGradient>
          </defs>
          <rect width="900" height="350" fill="url(#sea)" />
          <rect width="900" height="350" fill="url(#grid)" />
          <g fill="#64715a" stroke="#9b9b75" strokeWidth="1.2">
            <path d="M179 72L205 38 233 24 249 47 236 69 250 89 224 104 205 116 214 143 242 152 260 129 268 137 266 156 293 161 306 145 293 134 303 111 323 90 341 73 335 43 380 29 408 35 429 27 467 42 503 32 551 39 579 28 620 38 645 58 686 49 737 72 724 91 747 109 718 132 694 157 673 151 663 168 635 170 625 198 604 221 584 197 575 175 553 185 544 218 529 226 514 208 502 185 479 172 450 179 422 166 398 147 379 150 360 163 343 160 323 170 300 176 285 161 279 172 260 166 251 186 241 171 229 163 213 160 184 149 168 157 151 142 150 128 172 122 177 103 185 99Z" />
            <path
              d="M188 164L217 169 237 183 269 182 280 201 306 209 300 239 281 249 270 280 250 310 230 302 219 271 212 248 195 232 180 211 174 190Z"
              opacity=".4"
            />
            <path
              d="M678 248L715 236 743 246 755 238 778 254 794 281 780 305 752 301 734 309 712 298 685 299 669 281Z"
              opacity=".4"
            />
            <path d="M613 224L632 229 641 246 631 253 610 244Z M649 233L670 249 660 257 645 248Z M688 145L701 124 701 106 709 103 710 125 699 143Z M159 80L166 65 174 66 175 85 167 104 156 100Z" />
          </g>
          <path
            d="M294 141Q341 164 397 161T556 134"
            fill="none"
            stroke="#c9b37f"
            strokeDasharray="4 7"
            opacity=".5"
          />
          <g
            className="atlas-pin"
            onClick={() => {
              setSelected("aurelia");
              setConfirm(false);
            }}
            tabIndex="0"
            role="button"
            aria-label="Choose Europe"
            onKeyDown={(e) => e.key === "Enter" && setSelected("aurelia")}
          >
            <circle
              cx="262"
              cy="104"
              r="25"
              fill={selected === "aurelia" ? "#bda575" : "#253c39"}
              stroke="#c8b482"
            />
            <path
              d="M249 111V99L258 103 262 94 267 103 275 99V111Z"
              fill="#e6d5ad"
            />
            <text x="262" y="149">
              EUROPE
            </text>
          </g>
          <g
            className="atlas-pin"
            onClick={() => {
              setSelected("shen");
              setConfirm(false);
            }}
            tabIndex="0"
            role="button"
            aria-label="Choose Asia"
            onKeyDown={(e) => e.key === "Enter" && setSelected("shen")}
          >
            <circle
              cx="564"
              cy="116"
              r="25"
              fill={selected === "shen" ? "#bda575" : "#253c39"}
              stroke="#c8b482"
            />
            <path
              d="M550 124L563 105 578 124Z"
              fill="none"
              stroke="#e6d5ad"
              strokeWidth="2"
            />
            <text x="564" y="160">
              ASIA
            </text>
          </g>
          <g
            className="atlas-pin"
            onClick={() => {
              setSelected("ashur");
              setConfirm(false);
            }}
            tabIndex="0"
            role="button"
            aria-label="Choose Middle East"
            onKeyDown={(e) => e.key === "Enter" && setSelected("ashur")}
          >
            <circle
              cx="367"
              cy="189"
              r="25"
              fill={selected === "ashur" ? "#bda575" : "#253c39"}
              stroke="#c8b482"
            />
            <circle
              cx="367"
              cy="189"
              r="9"
              fill="none"
              stroke="#e6d5ad"
              strokeWidth="2"
            />
            <text x="367" y="234">
              MIDDLE EAST
            </text>
          </g>
          <g className="locked-region">
            <text x="230" y="259">
              AFRICA
            </text>
            <text x="230" y="277" className="soon">
              COMING SOON
            </text>
            <text x="732" y="279">
              AUSTRALIA
            </text>
            <text x="732" y="296" className="soon">
              COMING SOON
            </text>
          </g>
          <text
            x="56"
            y="311"
            fill="#b4ab8b"
            fontFamily="Cinzel"
            fontSize="11"
            letterSpacing="3"
          >
            THE KNOWN WORLD
          </text>
          <path
            d="M827 266V317M801 291H852M827 271L821 291 827 286 833 291Z"
            stroke="#b4ab8b"
            fill="#b4ab8b"
            opacity=".7"
          />
          <text x="823" y="258" fill="#b4ab8b" fontSize="10">
            N
          </text>
        </svg>
      </div>
      <div className="civilization-grid">
        {CIVILIZATIONS.map((c, i) => (
          <button
            key={c.id}
            className={`civilization-card ${selected === c.id ? "selected" : ""}`}
            onClick={() => {
              setSelected(c.id);
              setConfirm(false);
            }}
          >
            <div className={`civ-emblem ${c.id}`}>
              <Icon name={["Crown", "Mountain", "Sun"][i]} size={28} />
            </div>
            <span className="eyebrow">{c.region}</span>
            <h3>{c.name}</h3>
            <span className="civ-era">
              {c.era} ·{" "}
              {c.startYear < 0
                ? `${Math.abs(c.startYear)} BCE`
                : `${c.startYear} CE`}
            </span>
            <p>{c.description}</p>
            <span className="civ-bonus">{c.bonus}</span>
            {selected === c.id && (
              <Icon name="CheckCircle2" className="civ-check" size={18} />
            )}
          </button>
        ))}
      </div>
      <section className="mode-picker" aria-label="Choose a game mode">
        <div className="mode-picker-heading">
          <span className="eyebrow">CHOOSE YOUR PATH</span>
          <p>Three ways to begin your legend.</p>
        </div>
        <div className="mode-grid">
          {modes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`mode-card ${mode === option.id ? "selected" : ""}`}
              aria-pressed={mode === option.id}
              onClick={() => {
                setMode(option.id);
                setConfirm(false);
              }}
            >
              <Icon name={option.icon} size={20} />
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="world-start">
        <div>
          <span className="eyebrow">
            {mode === "starter"
              ? "LEARN THE ART OF WAR"
              : mode === "story"
                ? "A NEW ORIGINAL SAGA"
                : "FOUND A REALM FROM NOTHING"}
          </span>
          <h3>
            {confirm
              ? "Replace your current campaign?"
              : mode === "starter"
                ? "A battle-ready frontier"
                : mode === "story"
                  ? "The Eagle & the Ash"
                  : civ.title}
          </h3>
          <p>
            {confirm
              ? "Your current progress will be replaced. This cannot be undone."
              : mode === "starter"
                ? "Command a ready army, defend your capital, and capture the nearby outpost."
                : mode === "story"
                  ? "Follow three original chapters through a struggle for the future of Aurelia."
                  : `Begin in the ${eraKitFor(civ.startYear).label} with one poor worker, no settlement, and only period tools: ${eraKitFor(civ.startYear).kit.join(", ")}.`}
          </p>
        </div>
        <div className="flex">
          {confirm && <Button onClick={() => setConfirm(false)}>Cancel</Button>}
          <Button
            variant="gold"
            icon={confirm ? "Check" : "ArrowRight"}
            onClick={() => (confirm ? onStart(selected, mode) : setConfirm(true))}
          >
            {confirm
              ? mode === "starter"
                ? "Begin frontier skirmish"
                : mode === "story"
                  ? "Begin story campaign"
                  : "Begin new campaign"
              : mode === "starter"
                ? "Choose skirmish"
                : mode === "story"
                  ? "Choose story"
                  : "Establish an empire"}
          </Button>
        </div>
      </div>
    </>
  );
}
const gatherOptions = [
  ["food", "Gather food", null],
  ["wood", "Gather wood", null],
  ["stone", "Mine stone", "pickaxe"],
  ["silver", "Pan for silver", "pickaxe"],
  ["gold", "Search for gold", null],
  ["meat", "Hunt for meat", ["bow", "crossbow"]],
];
export function WorkforcePanel({ game, command }) {
  const workers = game.workers || [];
  const inventory = game.inventory || [];
  const gatherReady = game.tick >= (game.gatherReadyAt || 0);
  const canHire =
    game.population < game.capacity &&
    game.resources.food >= 30 &&
    game.resources.meat >= 10;
  const hasFarm = game.buildings.some(
    (building) => building.type === "farm" && !building.readyAt,
  );
  const hasHut = game.buildings.some(
    (building) => building.type === "hut" && !building.readyAt,
  );
  const chosenEra = eraKitFor(game.timelineStartYear);
  return (
    <div className="workforce-panel">
      <div className="panel-intro">
        <p>Your realm begins with one worker and nothing else.</p>
        <span>
          {chosenEra.label} · {workers.length} worker
          {workers.length === 1 ? "" : "s"} · {game.population}/{game.capacity}{" "}
          population
        </span>
      </div>
      <section className="camp-kit">
        <span className="eyebrow">PERIOD KIT</span>
        <div>
          {inventory.map((item) => (
            <span key={item}>{item.replace(/_/g, " ")}</span>
          ))}
        </div>
      </section>
      <section className="gather-section">
        <div className="workforce-heading">
          <div>
            <span className="eyebrow">SURVIVE THE FIRST DAYS</span>
            <h3>Gather by hand</h3>
          </div>
          <small>
            {gatherReady
              ? "Ready to forage"
              : `Resting · ${game.gatherReadyAt - game.tick}s`}
          </small>
        </div>
        <p>
          Each order sends a worker out to collect a small amount. Better tools
          and assigned specialists improve your chances.
        </p>
        <div className="gather-grid">
          {gatherOptions.map(([resource, label, tool]) => {
            const tools = tool ? (Array.isArray(tool) ? tool : [tool]) : [];
            const available =
              !tools.length || tools.some((item) => inventory.includes(item));
            const toolHint = tools.join(" or ");
            return (
              <Button
                key={resource}
                variant="small"
                icon={
                  resource === "wood"
                    ? "Trees"
                    : resource === "stone"
                      ? "Mountain"
                      : resource === "silver" || resource === "gold"
                        ? "Coins"
                        : resource === "meat"
                          ? "Crosshair"
                          : "Wheat"
                }
                disabled={!workers.length || !gatherReady || !available}
                title={!available ? `Requires ${toolHint}` : label}
                onClick={() => command("gather", { resource })}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </section>
      <section className="villager-section">
        <div className="workforce-heading">
          <div>
            <span className="eyebrow">A GROWING CAMP</span>
            <h3>People & roles</h3>
          </div>
          <Button
            variant="gold small"
            icon="Plus"
            disabled={!canHire}
            title={
              game.population >= game.capacity
                ? "Build a mini-house to increase population capacity"
                : "Hire a worker · 30 food and 10 meat"
            }
            onClick={() => command("hire")}
          >
            Hire · 30 food / 10 meat
          </Button>
        </div>
        {!workers.length ? (
          <p className="empty-workforce">No workers in the camp yet.</p>
        ) : (
          <div className="worker-list">
            {workers.map((worker) => (
              <article className="worker-card" key={worker.id}>
                <div className="worker-portrait">
                  <Icon
                    name={WORKER_ROLES[worker.role]?.icon || "Pickaxe"}
                    size={22}
                  />
                </div>
                <div className="worker-details">
                  <strong>{worker.name}</strong>
                  <span>
                    {worker.gender === "f" ? "Woman" : "Man"} ·{" "}
                    {WORKER_ROLES[worker.role]?.name || "Poor Worker"}
                  </span>
                  <select
                    aria-label={`Assign a role to ${worker.name}`}
                    value={worker.role}
                    onChange={(event) =>
                      command("assign", {
                        workerId: worker.id,
                        role: event.target.value,
                      })
                    }
                  >
                    {Object.entries(WORKER_ROLES).map(([role, definition]) => {
                      const locked =
                        (definition.requires === "farm" && !hasFarm) ||
                        (definition.requires === "hut" && !hasHut) ||
                        (definition.female && worker.gender !== "f");
                      return (
                        <option key={role} value={role} disabled={locked}>
                          {definition.name}
                          {locked
                            ? " · requires building or eligible villager"
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                  <small>{WORKER_ROLES[worker.role]?.description}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="coronation-section">
        <span className="eyebrow">THE FOUNDERS’ FATE</span>
        <h3>
          {game.hero?.path
            ? game.hero.title
            : "A worker may become king or tyrant"}
        </h3>
        <p>
          {game.hero?.path
            ? `${game.hero.rank} · ${game.hero.name}`
            : "Build a town center and grow to 25 people before choosing your path."}
        </p>
        {!game.hero?.path && (
          <div className="coronation-actions">
            <Button
              variant="small"
              icon="Crown"
              disabled={
                game.population < 25 ||
                !game.buildings.some(
                  (building) => building.id === "capital" && !building.readyAt,
                )
              }
              onClick={() => command("coronate", { path: "king" })}
            >
              Crown as king
            </Button>
            <Button
              variant="small"
              icon="Flame"
              disabled={
                game.population < 25 ||
                !game.buildings.some(
                  (building) => building.id === "capital" && !building.readyAt,
                )
              }
              onClick={() => command("coronate", { path: "tyrant" })}
            >
              Become tyrant lord
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
export function StoryPanel({ game, command, onStart }) {
  const [chapter, setChapter] = useState(Math.min(game.chapter, 2)),
    [cinematic, setCinematic] = useState(false),
    [confirm, setConfirm] = useState(false),
    [beat, setBeat] = useState(0);
  const story = STORY[chapter];
  useEffect(() => {
    if (!cinematic) return;
    setBeat(0);
    const t = setInterval(() => setBeat((v) => Math.min(3, v + 1)), 4500);
    return () => clearInterval(t);
  }, [cinematic]);
  if (cinematic)
    return (
      <div className="cinematic">
        <img
          src="/assets/kingdom.jpg"
          alt="The armies of Aurelia march toward their distant capital"
        />
        <div className="cinematic-shade" />
        <div className="cinematic-top">
          <span>{story.subtitle}</span>
          <button onClick={() => setCinematic(false)}>
            SKIP <Icon name="ChevronRight" size={15} />
          </button>
        </div>
        <div className="cinematic-dialogue" key={beat}>
          <span>
            {beat === 0 ? "THE VALLEY OF AURELIA" : story.speaker.toUpperCase()}
          </span>
          <p>
            {beat === 0
              ? "Before an empire, there was a promise."
              : story.dialogue
                  .split(". ")
                  .slice(beat - 1, beat)
                  .join(". ")}
          </p>
          {beat === 3 && (
            <Button
              variant="gold"
              onClick={() => setCinematic(false)}
              icon="ArrowRight"
            >
              Continue the story
            </Button>
          )}
        </div>
        <div className="cinematic-progress">
          <i style={{ width: `${(beat + 1) * 25}%` }} />
        </div>
      </div>
    );
  const objectiveDone =
    chapter === 0
      ? game.constructed.includes("farm") && game.recruited > 0
      : chapter === 1
        ? game.sites[0].owner === "player"
        : game.sites[1].owner === "player";
  return (
    <>
      <div className="story-hero">
        <img
          src="/assets/kingdom.jpg"
          alt="An ancient kingdom in the golden light of a new dawn"
        />
        <div>
          <span className="eyebrow">AN ORIGINAL SAGA</span>
          <h2>The Eagle & the Ash</h2>
          <p>
            A broken oath. A forgotten valley.
            <br />
            One commander who refused to kneel.
          </p>
          <Button icon="Play" onClick={() => setCinematic(true)}>
            Watch chapter prologue
          </Button>
        </div>
      </div>
      <div className="chapter-tabs">
        {STORY.map((s, i) => (
          <button
            key={s.id}
            disabled={i > game.chapter}
            onClick={() => setChapter(i)}
            className={chapter === i ? "active" : ""}
          >
            <span>
              {i > game.chapter ? (
                <Icon name="Lock" size={16} />
              ) : game.completedChapters.includes(i) ? (
                <Icon name="Check" size={16} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <small>CHAPTER {["I", "II", "III"][i]}</small>
              <strong>{s.title}</strong>
            </div>
          </button>
        ))}
      </div>
      <div className="story-content">
        <div>
          <span className="eyebrow">{story.subtitle}</span>
          <h3>{story.title}</h3>
          <blockquote>“{story.dialogue}”</blockquote>
          <span className="story-speaker">— {story.speaker}</span>
        </div>
        <div className="mission-box">
          <span className="eyebrow">MISSION OBJECTIVE</span>
          <p>
            <Icon name={objectiveDone ? "CheckCircle2" : "Flag"} size={18} />
            {story.objective}
          </p>
          <div className="mission-reward">
            <Icon name="Coins" size={18} />
            {story.reward} gold <span>Chapter reward</span>
          </div>
          {game.mode === "story" ? (
            <Button
              variant="gold"
              disabled={
                !objectiveDone || game.completedChapters.includes(chapter)
              }
              onClick={async () => {
                const result = await command("claim");
                if (result) setChapter(Math.min(result.chapter, 2));
              }}
            >
              {game.completedChapters.includes(chapter)
                ? "Chapter completed"
                : "Claim chapter reward"}
            </Button>
          ) : (
            <>
              <Button
                variant="gold"
                icon="Play"
                onClick={() =>
                  confirm
                    ? onStart(game.civilization, "story")
                    : setConfirm(true)
                }
              >
                {confirm ? "Confirm new story campaign" : "Begin story mode"}
              </Button>
              {confirm && (
                <small className="warning">
                  This starts a new empire and replaces your current campaign.{" "}
                  <button
                    className="text-btn"
                    onClick={() => setConfirm(false)}
                  >
                    Cancel
                  </button>
                </small>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
export function ProfilePanel({ game, user, open }) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    api("/profile")
      .then(setProfile)
      .catch(() => {});
  }, []);
  const civ = CIVILIZATIONS.find((c) => c.id === game.civilization);
  const xp = profile?.xp || 0;
  return (
    <>
      <div className="profile-banner">
        <Portrait large />
        <div>
          <span className="eyebrow">
            {civ.name} · {user.guest ? "GUEST COMMANDER" : "VERIFIED COMMANDER"}
          </span>
          <h2>{user.guest ? "Aelius Valerius" : user.name}</h2>
          <p>Every great empire begins with a single standard.</p>
          <div className="level-progress">
            <span>LEVEL {profile?.level || 1}</span>
            <div>
              <i style={{ width: `${(xp % 300) / 3}%` }} />
            </div>
            <span>{xp % 300} / 300 XP</span>
          </div>
          {user.guest && (
            <button className="text-btn gold-text" onClick={() => open("auth")}>
              Secure your legacy — create an account{" "}
              <Icon name="ArrowRight" size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="profile-stats">
        {[
          ["Swords", game.victories, "Victories"],
          ["Shield", game.defeats, "Defeats"],
          ["Flag", game.territories, "Territories"],
          [
            "Users",
            game.armies.filter((a) => !a.enemy).length,
            "Active cohorts",
          ],
          ["BookOpen", game.technologies.length, "Technologies"],
          ["Crown", game.power.toLocaleString(), "Empire power"],
        ].map(([i, v, k]) => (
          <div key={k}>
            <Icon name={i} />
            <strong>{v}</strong>
            <span>{k}</span>
          </div>
        ))}
      </div>
      <div className="profile-bottom">
        <section>
          <span className="eyebrow">MILITARY RECORD</span>
          <h3>The story so far</h3>
          <div className="record-row">
            <span>Enemy cohorts defeated</span>
            <strong>{game.kills}</strong>
          </div>
          <div className="record-row">
            <span>Buildings established</span>
            <strong>{game.buildings.length}</strong>
          </div>
          <div className="record-row">
            <span>Chapters completed</span>
            <strong>{game.completedChapters.length} / 3</strong>
          </div>
          <div className="record-row">
            <span>Capital</span>
            <strong>{civ.capital}</strong>
          </div>
          <div className="record-row">
            <span>Territories conquered</span>
            <strong>
              {game.sites
                .filter((s) => s.owner === "player")
                .map((s) => s.name)
                .join(", ") || "None yet"}
            </strong>
          </div>
        </section>
        <section>
          <span className="eyebrow">YOUR COMMAND</span>
          <h3>Warriors of {civ.capital}</h3>
          <div className="profile-roster">
            {CHARACTERS.filter(
              (c) => !c.enemy && c.civilization === game.civilization,
            )
              .slice(0, 5)
              .map((c) => (
                <Portrait character={c} key={c.id} />
              ))}
          </div>
          <Button icon="Users" onClick={() => open("roster")}>
            Explore your warriors
          </Button>
        </section>
      </div>
    </>
  );
}
export function ExtrasPanel({ game, open }) {
  const [tab, setTab] = useState("Chronicles");
  const achievements = [
    ["First Standard", "Establish a capital.", true, "Flag"],
    [
      "Builder of Worlds",
      "Construct 5 new buildings.",
      game.constructed.length >= 5,
      "Hammer",
    ],
    [
      "A Scholar’s Mind",
      "Discover 3 technologies.",
      game.technologies.length >= 3,
      "BookOpen",
    ],
    [
      "Beyond the River",
      "Capture Riverwatch.",
      game.sites[0].owner === "player",
      "Swords",
    ],
    [
      "The Unifier",
      "Own every territory in the valley.",
      game.territories === 4,
      "Crown",
    ],
    [
      "A Living Legend",
      "Complete every story chapter.",
      game.chapter >= 3,
      "Star",
    ],
  ];
  return (
    <>
      <div className="tabs padded">
        {["Chronicles", "Civilizations", "Achievements", "Credits"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Chronicles" ? (
        <div className="extras-content">
          <div className="lore-art">
            <img src="/assets/kingdom.jpg" alt="The Aurelian valley" />
            <span>THE CHRONICLES OF THE ANCIENT WORLD</span>
          </div>
          <h3>Before the first empire</h3>
          <p>
            For generations, the great river bound three peoples together. Grain
            traveled west, bronze traveled east, and every caravan carried a
            story. Then the old kings died. Their roads became borders. Their
            watchtowers became prisons.
          </p>
          <p>
            In the forgotten valley of Aurelia, a small company of soldiers
            raises a different standard. Their promise is simple: a home worth
            defending. Beyond the mountains, the Shen Dynasty watches. Across
            the desert, Ashuran merchants count the cost of war. No empire rises
            alone.
          </p>
          <div className="extras-links">
            <Button icon="Users" onClick={() => open("roster")}>
              Warrior encyclopedia
            </Button>
            <Button icon="BookOpen" onClick={() => open("research")}>
              Technology library
            </Button>
            <Button icon="Globe" onClick={() => open("world")}>
              Atlas of the known world
            </Button>
          </div>
        </div>
      ) : tab === "Civilizations" ? (
        <div className="extras-content civilization-lore">
          {CIVILIZATIONS.map((c, i) => (
            <article key={c.id}>
              <div className="civ-emblem">
                <Icon name={["Crown", "Mountain", "Sun"][i]} size={30} />
              </div>
              <div>
                <span className="eyebrow">{c.region}</span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <p className="gold-text">{c.bonus}</p>
                <small>
                  Capital: {c.capital} · 9 unique recruitable warriors
                </small>
              </div>
            </article>
          ))}
          <div className="notice">
            <Icon name="Lock" />
            Africa and Australia are future expansions, not playable in this
            release.
          </div>
        </div>
      ) : tab === "Achievements" ? (
        <div className="achievement-grid">
          {achievements.map(([name, desc, done, icon]) => (
            <article key={name} className={done ? "unlocked" : ""}>
              <div className="achievement-icon">
                <Icon name={icon} size={30} />
              </div>
              <h3>{name}</h3>
              <p>{desc}</p>
              <span>
                <Icon name={done ? "CheckCircle2" : "Lock"} size={14} />
                {done ? "Unlocked" : "Not yet earned"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="credits">
          <Icon name="Crown" size={54} />
          <h2>Dawn of Warriors</h2>
          <span className="eyebrow">
            ANCIENT TIMES · PLAYABLE FOUNDATION 0.1.0
          </span>
          <p>An original ancient-world strategy experience.</p>
          <p>
            Built with React, Three.js, Express, and SQLite.
            <br />
            Interface icons by Lucide. Fonts by Google Fonts.
            <br />
            Original AI-generated kingdom and commander illustrations.
            <br />
            Procedural terrain, architecture, warrior portraits, and ambient
            sound.
          </p>
          <p className="muted">
            Historical inspiration, fictional civilizations.
            <br />
            Not affiliated with Age of Empires, Rise of Kingdoms, or Call of
            Duty.
          </p>
          <div className="notice">
            This foundation includes three regional variations of one valley
            map, real-time cohort combat, economy, construction, research, a
            54-warrior catalog, and a three-chapter story. Expanded maps,
            advanced AI, equipment systems, full cinematics, and two-factor
            authentication are not yet included.
          </div>
        </div>
      )}
    </>
  );
}
