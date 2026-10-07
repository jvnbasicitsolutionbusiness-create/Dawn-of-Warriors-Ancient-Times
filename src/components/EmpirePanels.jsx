import React, { useState } from "react";
import {
  BUILDINGS,
  CHARACTERS,
  TECHNOLOGIES,
  CIVILIZATIONS,
} from "../../shared/catalog";
import { Icon, Button, Cost, Portrait, Empty } from "./UI";
export function BuildPanel({ game, onPlace, command }) {
  const [category, setCategory] = useState("All buildings");
  const categories = ["All buildings", "Economy", "Military", "Civil"];
  const economic = [
    "farm",
    "lumber",
    "quarry",
    "goldmine",
    "market",
    "storage",
    "harbor",
  ];
  const military = [
    "barracks",
    "archery",
    "stable",
    "siege",
    "wall",
    "tower",
    "academy",
    "blacksmith",
  ];
  return (
    <>
      <div className="panel-intro">
        <p>Lay the foundations of your civilization.</p>
        <span>
          <Icon name="MousePointer2" size={15} /> Choose a building, then place
          it inside your borders.
        </span>
      </div>
      <div className="tabs">
        {categories.map((c) => (
          <button
            className={c === category ? "active" : ""}
            onClick={() => setCategory(c)}
            key={c}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {BUILDINGS.filter(
          (b) =>
            category === "All buildings" ||
            (category === "Economy"
              ? economic.includes(b.id)
              : category === "Military"
                ? military.includes(b.id)
                : !economic.includes(b.id) && !military.includes(b.id)),
        ).map((b) => {
          const locked = b.requires && !game.technologies.includes(b.requires);
          const becomesCapital =
            b.id === "towncenter" &&
            !game.buildings.some((building) => building.id === "capital");
          const cost = becomesCapital ? { wood: 150, stone: 100 } : b.cost;
          const enough = Object.entries(cost).every(
            ([r, v]) => game.resources[r] >= v,
          );
          return (
            <article className="catalog-card" key={b.id}>
              <div className={`building-art ${b.id}`}>
                <Icon name={b.icon} size={48} />
                <span className="art-number">
                  {game.buildings.filter((t) => t.type === b.id).length} built
                </span>
              </div>
              <div className="card-body">
                <div className="card-heading">
                  <h3>{b.name}</h3>
                  <span className="time">
                    <Icon name="Timer" size={13} />
                    {b.time}s
                  </span>
                </div>
                <p>{b.description}</p>
                {b.production && (
                  <span className="production">
                    {Object.entries(b.production)
                      .map(([r, v]) => `+${v} ${r}/s`)
                      .join(" · ")}
                  </span>
                )}
                <div className="card-bottom">
                  <Cost cost={cost} resources={game.resources} />
                  <button
                    className="small-action"
                    disabled={locked || !enough}
                    onClick={() => onPlace(b.id)}
                    title={
                      locked
                        ? `Requires ${b.requires}`
                        : !enough
                          ? "Insufficient resources"
                          : `Place ${b.name}`
                    }
                  >
                    <Icon name={locked ? "Lock" : "Plus"} size={17} />
                  </button>
                </div>
                {locked && (
                  <small className="locked-note">
                    Requires{" "}
                    {TECHNOLOGIES.find((t) => t.id === b.requires)?.name}
                  </small>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="panel-footer">
        <Icon name="Shield" size={16} />
        <span>
          Buildings must be placed on land, within a friendly settlement’s
          borders.
        </span>
      </div>
    </>
  );
}
export function RecruitPanel({ game, command }) {
  const characters = CHARACTERS.filter(
    (c) => c.civilization === game.civilization && !c.enemy,
  );
  return (
    <>
      <div className="panel-intro">
        <p>One banner. Countless stories.</p>
        <span>
          <Icon name="Users" size={16} />
          {game.population} / {game.capacity} population · Each cohort contains
          6 soldiers
        </span>
      </div>
      {game.recruiting.length > 0 && (
        <div className="queue">
          <Icon name="Timer" />
          <div>
            <strong>Training in progress</strong>
            <p>
              {game.recruiting
                .map(
                  (q) =>
                    `${CHARACTERS.find((c) => c.id === q.character).title} · ${Math.max(0, q.readyAt - game.tick)}s`,
                )
                .join("  /  ")}
            </p>
          </div>
        </div>
      )}
      <div className="recruit-grid">
        {characters.map((c) => {
          const locked = !game.buildings.some(
            (b) => b.type === c.building && !b.readyAt,
          );
          return (
            <article className="recruit-card" key={c.id}>
              <Portrait character={c} />
              <div className="recruit-info">
                <span className="eyebrow">
                  {c.rank} · {c.class}
                </span>
                <h3>{c.title}</h3>
                <span className="muted">Led by {c.name}</span>
                <div className="unit-stats">
                  <span title="Health">
                    <Icon name="Heart" size={13} />
                    {c.hp}
                  </span>
                  <span title="Attack">
                    <Icon name="Sword" size={13} />
                    {c.attack}
                  </span>
                  <span title="Defense">
                    <Icon name="Shield" size={13} />
                    {c.defense}
                  </span>
                </div>
                <div className="recruit-footer">
                  <Cost cost={c.cost} resources={game.resources} />
                  <Button
                    variant="small"
                    disabled={
                      locked ||
                      game.population + 6 > game.capacity ||
                      Object.entries(c.cost).some(
                        ([r, v]) => game.resources[r] < v,
                      )
                    }
                    icon={locked ? "Lock" : "Plus"}
                    onClick={() => command("recruit", { character: c.id })}
                  >
                    {locked
                      ? BUILDINGS.find((b) => b.id === c.building).name
                      : "Recruit"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
export function ResearchPanel({ game, command }) {
  return (
    <>
      <div className="panel-intro">
        <p>Knowledge is the foundation of an enduring empire.</p>
        <span>
          {game.technologies.length} / {TECHNOLOGIES.length} technologies
          discovered
        </span>
      </div>
      {game.research && (
        <div className="queue">
          <Icon name="BookOpen" />
          <div>
            <strong>
              {TECHNOLOGIES.find((t) => t.id === game.research.id).name}
            </strong>
            <p>
              Scholars at work ·{" "}
              {Math.max(0, game.research.readyAt - game.tick)} seconds remaining
            </p>
          </div>
          <div className="spinner" />
        </div>
      )}
      <div className="tech-grid">
        {TECHNOLOGIES.map((t) => {
          const done = game.technologies.includes(t.id),
            active = game.research?.id === t.id,
            locked =
              t.prerequisite && !game.technologies.includes(t.prerequisite);
          return (
            <article
              className={`tech-card ${done ? "complete" : ""} ${locked ? "locked" : ""}`}
              key={t.id}
            >
              <div className="tech-top">
                <span className="tech-icon">
                  <Icon name={t.icon} size={25} />
                </span>
                <span className="eyebrow">{t.category}</span>
                {done && <Icon name="CheckCircle2" className="success" />}
              </div>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              {t.prerequisite && (
                <div className="prerequisite">
                  <Icon name={locked ? "Lock" : "Check"} size={13} />
                  {TECHNOLOGIES.find((p) => p.id === t.prerequisite).name}
                </div>
              )}
              <div className="tech-bottom">
                <Cost cost={t.cost} resources={game.resources} />
                <Button
                  variant="small"
                  disabled={
                    done ||
                    locked ||
                    !!game.research ||
                    Object.entries(t.cost).some(
                      ([r, v]) => game.resources[r] < v,
                    )
                  }
                  onClick={() => command("research", { technology: t.id })}
                >
                  {done
                    ? "Discovered"
                    : active
                      ? "Studying…"
                      : `${t.time}s · Research`}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
export function RosterPanel({ game, command, encyclopedia = false }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All warriors"),
    [chosen, setChosen] = useState(null);
  const roster = CHARACTERS.filter(
    (c) =>
      (filter === "All warriors" ||
        (filter === "Your civilization" &&
          !c.enemy &&
          c.civilization === game.civilization) ||
        (filter === "Rival kingdoms" && c.enemy)) &&
      `${c.name} ${c.class} ${c.faction}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (chosen) {
    const c = chosen;
    const canRecruit =
      !c.enemy &&
      c.civilization === game.civilization &&
      game.buildings.some((b) => b.type === c.building && !b.readyAt);
    return (
      <div className="character-detail">
        <button className="text-btn" onClick={() => setChosen(null)}>
          <Icon name="ArrowLeft" size={16} /> Back to the roster
        </button>
        <div className="detail-layout">
          <div>
            <Portrait character={c} large />
            <div className="character-faction">
              <Icon name="Flag" />
              {c.faction}
            </div>
          </div>
          <div>
            <span className="eyebrow">
              {c.rank} {c.class} ·{" "}
              {c.enemy ? "AI-controlled rival" : "Playable warrior"}
            </span>
            <h2>{c.name}</h2>
            <h4>{c.title}</h4>
            <p className="detail-description">
              {c.description} Wearing {c.appearance.armor}, this warrior serves
              under the {c.appearance.crest} standard.
            </p>
            <div className="detail-stats">
              {[
                ["Health", c.hp, "Heart"],
                ["Attack", c.attack, "Sword"],
                ["Defense", c.defense, "Shield"],
                ["Movement", c.speed, "Footprints"],
                ["Range", c.range, "Target"],
                ["Attack interval", `${c.attackSpeed}s`, "Timer"],
              ].map(([k, v, i]) => (
                <div key={k}>
                  <Icon name={i} />
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <div className="ability">
              <Icon name="Sparkles" />
              <div>
                <h4>{c.ability}</h4>
                <p>{c.description}</p>
              </div>
            </div>
            <span className="eyebrow">MILITARY PROGRESSION</span>
            <div className="rank-path">
              {c.upgradePath.map((r, i) => (
                <React.Fragment key={r}>
                  <span>{r}</span>
                  {i < 2 && <Icon name="ChevronRight" size={14} />}
                </React.Fragment>
              ))}
            </div>
            <p className="muted small-text">
              Cohorts gain 50 XP per defeated enemy. Every 100 XP grants a level
              and +12% attack. Forging and armor research improve your entire
              army.
            </p>
            <div className="detail-actions">
              <Cost cost={c.cost} />
              {!encyclopedia && (
                <Button
                  variant="gold"
                  disabled={!canRecruit}
                  onClick={() => command("recruit", { character: c.id })}
                  icon={canRecruit ? "Plus" : "Lock"}
                >
                  {c.enemy
                    ? "Enemy commander"
                    : c.civilization !== game.civilization
                      ? "Another civilization"
                      : canRecruit
                        ? "Recruit cohort"
                        : `Requires ${BUILDINGS.find((b) => b.id === c.building).name}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="panel-intro">
        <p>Every warrior has a story. Every army, a legacy.</p>
        <span>54 warriors · 6 factions · 9 combat roles</span>
      </div>
      <div className="roster-toolbar">
        <div className="tabs">
          {["All warriors", "Your civilization", "Rival kingdoms"].map((f) => (
            <button
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
              key={f}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="Search" size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a warrior…"
            aria-label="Search warriors"
          />
        </label>
      </div>
      <div className="roster-grid">
        {roster.map((c) => (
          <button
            className="warrior-card"
            key={c.id}
            onClick={() => setChosen(c)}
          >
            <Portrait character={c} />
            <div className="warrior-info">
              <span className={`rank ${c.rank.toLowerCase()}`}>{c.rank}</span>
              <h3>{c.name}</h3>
              <span>{c.class}</span>
              <small>{c.faction}</small>
            </div>
            {c.enemy && <span className="enemy-badge">RIVAL</span>}
          </button>
        ))}
      </div>
      {!roster.length && (
        <Empty icon="Search">No warriors match your search.</Empty>
      )}
    </>
  );
}
