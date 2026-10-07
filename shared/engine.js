const randomUUID = () => globalThis.crypto.randomUUID();
import {
  BUILDINGS,
  CHARACTERS,
  TECHNOLOGIES,
  CIVILIZATIONS,
  GAME_RULES,
  WORKER_ROLES,
  VILLAGER_NAMES,
  FOUND_ITEMS,
  eraKitFor,
  historicalAgeFor,
  commanderFor,
} from "./catalog.js";
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const riverX = (z) => 12 + Math.sin(z / 14) * 5;
export function makeWorker(
  name,
  role = "worker",
  gender = "m",
  x = -15,
  z = 7,
  id = randomUUID(),
) {
  return {
    id,
    name,
    role,
    gender,
    x: x + (Math.random() * 4 - 2),
    z: z + (Math.random() * 4 - 2),
    target: null,
    path: [],
    status: "Idle",
    hp: 100,
    maxHp: 100,
  };
}
export function makeArmy(character, x, z, enemy = false, id = randomUUID()) {
  const c = CHARACTERS.find((c) => c.id === character);
  return {
    id,
    character,
    name: c.title,
    x,
    z,
    hp: c.hp * 6,
    maxHp: c.hp * 6,
    count: 6,
    enemy,
    level: 1,
    xp: 0,
    target: null,
    path: [],
    formation: "line",
    status: "Idle",
    cooldown: 0,
  };
}
const initialSites = [
  {
    id: "riverwatch",
    name: "Riverwatch",
    x: 26,
    z: 1,
    owner: "enemy",
    hp: 900,
    maxHp: 900,
    reward: 250,
  },
  {
    id: "citadel",
    name: "Iron Citadel",
    x: 32,
    z: -29,
    owner: "enemy",
    hp: 2200,
    maxHp: 2200,
    reward: 700,
  },
  {
    id: "sanctuary",
    name: "Old Sanctuary",
    x: -30,
    z: -22,
    owner: "neutral",
    hp: 400,
    maxHp: 400,
    reward: 180,
  },
];
export function newGame(civilization = "aurelia", mode = "starter") {
  const civ =
    CIVILIZATIONS.find((c) => c.id === civilization) || CIVILIZATIONS[0];
  const f = Math.max(
    0,
    CIVILIZATIONS.findIndex((c) => c.id === civilization),
  );
  const faction = f % 3;
  const enemyFaction = 3 + (f % 3);
  const now = Date.now();
  const lone = mode === "campaign" || mode === "story";
  const era = eraKitFor(civ.startYear);
  const commander = commanderFor(civilization);
  const enemies = [
    makeArmy(`unit-${enemyFaction}-0`, 24, 1, true, "guard"),
    makeArmy(`unit-${enemyFaction}-1`, 30, -23, true, "guard2"),
    makeArmy(`unit-${enemyFaction}-2`, 35, -27, true, "guard3"),
  ];
  const armies = lone
    ? []
    : [
        makeArmy(`unit-${faction}-0`, -14, 7, false, "legion"),
        makeArmy(`unit-${faction}-1`, -12, 5, false, "cohort2"),
        ...enemies,
      ];
  const buildings = lone
    ? []
    : [
        {
          id: "capital",
          type: "towncenter",
          x: -15,
          z: 7,
          level: 1,
          hp: 2000,
          maxHp: 2000,
          readyAt: 0,
        },
        {
          id: "barracks",
          type: "barracks",
          x: -11,
          z: 12,
          level: 1,
          hp: 850,
          maxHp: 850,
          readyAt: 0,
        },
        {
          id: "tower",
          type: "tower",
          x: -8,
          z: 7,
          level: 1,
          hp: 1100,
          maxHp: 1100,
          readyAt: 0,
        },
        {
          id: "wall1",
          type: "wall",
          x: -15,
          z: 18,
          level: 1,
          hp: 1800,
          maxHp: 1800,
          readyAt: 0,
        },
      ];
  const workers = lone
    ? [makeWorker(commander.name, "commander", "m", -15, 7, "commander")]
    : [];
  return {
    version: 3,
    civilization,
    mode,
    createdAt: now,
    updatedAt: now,
    tick: 0,
    timelineStartYear: civ.startYear ?? -400,
    resources: lone
      ? { food: 0, wood: 0, stone: 0, gold: 0, silver: 0, meat: 0 }
      : { food: 800, wood: 980, stone: 600, gold: 400, silver: 0, meat: 0 },
    inventory: lone ? [...era.kit] : [...GAME_RULES.startingInventory],
    hero: {
      ...commander,
      rank: lone ? "Founder" : "Commander",
      kit: lone ? [...era.kit] : [],
      path: null,
      empire: civ.name,
      color: civ.color,
      symbol: civ.symbol,
      region: civ.region,
    },
    workers,
    gatherReadyAt: 0,
    kingdomAwakened: !lone,
    kingdomAwakenedAt: lone ? null : 0,
    buildings,
    armies,
    sites: lone ? [] : initialSites.map((site) => ({ ...site })),
    technologies: [],
    research: null,
    recruiting: [],
    chapter: 0,
    completedChapters: [],
    victories: 0,
    defeats: 0,
    kills: 0,
    recruited: 0,
    constructed: [],
    events: [
      lone
        ? {
            id: now,
            text: `A small band of founders enters a ${era.label} with only period tools. The wilderness is theirs to shape.`,
            type: "info",
            at: now,
          }
        : {
            id: now,
            text: "Your standard rises over a new capital.",
            type: "info",
            at: now,
          },
    ],
    tutorial: 0,
    paused: false,
    outcome: null,
    formation: "line",
    diplomacy: "war",
    truceUntil: 0,
  };
}
function event(s, text, type = "info") {
  s.events.unshift({ id: randomUUID(), text, type, at: Date.now() });
  s.events = s.events.slice(0, 30);
}
function pay(s, cost) {
  for (const [r, v] of Object.entries(cost))
    if (s.resources[r] < v) throw Error(`Not enough ${r}.`);
  for (const [r, v] of Object.entries(cost)) s.resources[r] -= v;
}
export function population(s) {
  return (
    (s.workers || []).length +
    s.armies.filter((a) => !a.enemy).reduce((v, a) => v + a.count, 0) +
    s.recruiting.length * 6
  );
}
export function capacity(s) {
  const base = s.buildings.some((b) => b.id === "capital") ? 40 : 4;
  const huts = s.buildings.filter((b) => b.type === "hut" && !b.readyAt).length;
  const keepers = (s.workers || []).filter(
    (w) => w.role === "homemaker",
  ).length;
  return (
    base +
    huts * 4 +
    keepers * (WORKER_ROLES.homemaker.capacity || 2) +
    s.buildings.filter(
      (b) =>
        ["storage", "towncenter", "palace"].includes(b.type) &&
        b.id !== "capital" &&
        !b.readyAt,
    ).length *
      20
  );
}
export function rates(s) {
  const lone = !s.buildings.some((b) => b.id === "capital" && !b.readyAt);
  const r = lone
    ? { food: 0, wood: 0, stone: 0, gold: 0, silver: 0, meat: 0 }
    : { food: 1, wood: 1, stone: 0.5, gold: 0.3, silver: 0, meat: 0 };
  for (const b of s.buildings.filter((b) => !b.readyAt)) {
    for (const [k, v] of Object.entries(
      BUILDINGS.find((t) => t.id === b.type).production || {},
    ))
      r[k] = (r[k] || 0) + v * b.level;
  }
  for (const w of s.workers || []) {
    const role = WORKER_ROLES[w.role];
    if (!role?.rate) continue;
    for (const [k, v] of Object.entries(role.rate)) r[k] = (r[k] || 0) + v;
  }
  if (s.civilization === "shen") r.food *= 1.2;
  if (s.civilization === "ashur") r.gold *= 1.25;
  for (const [t, k] of [
    ["agriculture", "food"],
    ["irrigation", "food"],
    ["forestry", "wood"],
    ["mining", "stone"],
    ["trade", "gold"],
  ])
    if (s.technologies.includes(t)) r[k] *= 1.3;
  if (s.hero?.path === "king") for (const k of Object.keys(r)) r[k] *= 1.1;
  if (s.hero?.path === "tyrant") r.food *= 0.9;
  return r;
}
export function publicGame(s) {
  const startYear = s.timelineStartYear || -400;
  const totalYears = Math.floor(s.tick / 240);
  const year = startYear + totalYears;
  const absYear = Math.abs(year);
  const era = year < 0 ? "BCE" : "CE";
  const hour = Math.floor((s.tick / 15) % 24);
  const minute = Math.floor((s.tick * 4) % 60);
  const age = historicalAgeFor(year);
  return {
    ...s,
    rates: rates(s),
    population: population(s),
    capacity: capacity(s),
    storage:
      4000 +
      s.buildings.filter((b) => b.type === "storage" && !b.readyAt).length *
        2000,
    power: Math.round(
      s.armies.filter((a) => !a.enemy).reduce((n, a) => n + a.hp, 0) +
        s.buildings.reduce((n, b) => n + b.hp * 0.4, 0),
    ),
    territories: 1 + s.sites.filter((t) => t.owner === "player").length,
    timeline: {
      date: `${absYear} ${era}`,
      clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      year,
      ageIndex: age.index,
      ageLabel: age.label,
      hour,
      minute,
    },
  };
}
function route(a, x, z) {
  a.target = { x, z };
  a.path = [];
  if ((a.x - riverX(a.z)) * (x - riverX(z)) < 0) {
    const left = a.x < riverX(a.z);
    a.path.push({ x: left ? 7 : 20, z: 3 }, { x: left ? 20 : 7, z: 3 });
  }
  a.path.push({ x, z });
  a.status = "Marching";
}
export function action(s, type, data = {}) {
  if (s.outcome && !["tutorial", "pause", "claim"].includes(type))
    throw Error(
      "This campaign has ended. Start a new campaign from the world map.",
    );
  if (type === "move") {
    if (
      !Array.isArray(data.ids) ||
      data.ids.length > 100 ||
      !Number.isFinite(data.x) ||
      !Number.isFinite(data.z) ||
      Math.abs(data.x) > 47 ||
      Math.abs(data.z) > 39
    )
      throw Error("Invalid movement order.");
    let i = 0;
    for (const a of s.armies.filter(
      (army) => !army.enemy && data.ids.includes(army.id),
    )) {
      route(a, data.x + (i % 3) * 2, data.z + Math.floor(i / 3) * 2);
      i++;
    }
    for (const w of (s.workers || []).filter((worker) =>
      data.ids.includes(worker.id),
    )) {
      route(w, data.x + (i % 3) * 2, data.z + Math.floor(i / 3) * 2);
      i++;
    }
  } else if (type === "build") {
    const b = BUILDINGS.find((b) => b.id === data.building);
    if (!b) throw Error("Unknown building.");
    if (s.buildings.length >= 40)
      throw Error("Settlement building limit reached.");
    if (b.requires && !s.technologies.includes(b.requires))
      throw Error("Research the required technology first.");
    const { x, z } = data;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(z) ||
      Math.abs(x) > 44 ||
      Math.abs(z) > 36
    )
      throw Error("Choose a valid location.");
    const owned = [
      { x: -15, z: 7 },
      ...s.sites.filter((t) => t.owner === "player"),
    ];
    if (!owned.some((t) => dist(t, { x, z }) < 19))
      throw Error("Build within the borders of a friendly settlement.");
    if (Math.abs(x - riverX(z)) < 3)
      throw Error("Buildings cannot be placed in the river.");
    if (b.nearWater && Math.abs(x - riverX(z)) > 9)
      throw Error("A harbor must be near the river.");
    if (s.buildings.some((t) => dist(t, { x, z }) < 5))
      throw Error("Leave more space between your buildings.");
    const becomesCapital =
      b.id === "towncenter" && !s.buildings.some((t) => t.id === "capital");
    pay(s, becomesCapital ? { wood: 150, stone: 100 } : b.cost);
    const builders = (s.workers || []).filter(
      (w) => w.role === "builder",
    ).length;
    const time = Math.max(2, Math.round(b.time * (builders ? 0.7 : 1)));
    s.buildings.push({
      id: becomesCapital ? "capital" : randomUUID(),
      type: b.id,
      x,
      z,
      level: 1,
      hp: b.hp,
      maxHp: b.hp,
      readyAt: s.tick + time,
    });
    s.constructed.push(b.id);
    event(
      s,
      becomesCapital
        ? "The village grows walls and a hall: your first town center becomes the capital."
        : `${b.name} construction has begun.`,
    );
  } else if (type === "recruit") {
    const c = CHARACTERS.find(
      (c) =>
        c.id === data.character &&
        !c.enemy &&
        c.civilization === s.civilization,
    );
    if (!c) throw Error("Choose a unit from your civilization.");
    if (!s.buildings.some((b) => b.type === c.building && !b.readyAt))
      throw Error(
        `Build a ${BUILDINGS.find((b) => b.id === c.building).name} first.`,
      );
    if (population(s) + 6 > capacity(s))
      throw Error("Population limit reached. Build storage or a town center.");
    if (s.recruiting.length >= 5) throw Error("Recruitment queue is full.");
    pay(s, c.cost);
    s.recruiting.push({
      id: randomUUID(),
      character: c.id,
      readyAt: s.tick + 8 + s.recruiting.length * 5,
    });
    event(s, `${c.title} recruitment ordered.`);
  } else if (type === "research") {
    const t = TECHNOLOGIES.find((t) => t.id === data.technology);
    if (!t) throw Error("Unknown technology.");
    if (s.research) throw Error("A research project is already underway.");
    if (s.technologies.includes(t.id))
      throw Error("Technology already researched.");
    if (t.prerequisite && !s.technologies.includes(t.prerequisite))
      throw Error("Complete the prerequisite first.");
    pay(s, t.cost);
    s.research = { id: t.id, readyAt: s.tick + t.time };
    event(s, `Your scholars are studying ${t.name}.`);
  } else if (type === "upgrade" || type === "repair") {
    const b = s.buildings.find((b) => b.id === data.id);
    if (!b || b.readyAt) throw Error("Select a completed building.");
    if (type === "repair") {
      if (b.hp === b.maxHp) throw Error("This building is undamaged.");
      pay(s, { wood: 60, stone: 40 });
      b.hp = b.maxHp;
    } else {
      if (b.level >= 3) throw Error("Maximum building level reached.");
      const def = BUILDINGS.find((t) => t.id === b.type);
      pay(
        s,
        Object.fromEntries(
          Object.entries(def.cost).map(([k, v]) => [
            k,
            Math.ceil(v * b.level * 0.8),
          ]),
        ),
      );
      b.level++;
      b.maxHp += Math.round(def.hp * 0.4);
      b.hp = b.maxHp;
      event(s, `${def.name} upgraded to level ${b.level}.`);
    }
  } else if (type === "formation") {
    if (
      !["line", "defensive", "spear", "cavalry", "archer", "siege"].includes(
        data.formation,
      )
    )
      throw Error("Invalid formation.");
    s.formation = data.formation;
    for (const a of s.armies.filter((a) => !a.enemy))
      a.formation = data.formation;
  } else if (type === "hold") {
    for (const a of s.armies.filter(
      (a) => !a.enemy && (data.ids || []).includes(a.id),
    )) {
      a.target = null;
      a.path = [];
      a.status = "Holding";
    }
  } else if (type === "retreat") {
    for (const [i, a] of s.armies.filter((a) => !a.enemy).entries())
      route(a, -12 + (i % 3) * 3, 14 + Math.floor(i / 3) * 2);
    event(s, "Your armies are falling back to the capital.");
  } else if (type === "trade") {
    if (!s.buildings.some((b) => b.type === "market" && !b.readyAt))
      throw Error("Construct a market to trade.");
    pay(s, { wood: 100 });
    s.resources.gold += 60;
    event(s, "Caravan returned: 100 wood traded for 60 gold.");
  } else if (type === "diplomacy") {
    if (s.truceUntil > s.tick) throw Error("A truce is already in effect.");
    pay(s, { gold: 200 });
    s.truceUntil = s.tick + 90;
    s.diplomacy = "truce";
    s.armies
      .filter((a) => a.enemy)
      .forEach((a) => {
        a.path = [];
        a.target = null;
        a.status = "Truce";
      });
    event(s, "The Ironbound accept a 90-second truce.", "success");
  } else if (type === "tutorial") {
    s.tutorial = Math.min(10, s.tutorial + 1);
  } else if (type === "gather") {
    const yields = {
      wood: { amount: 4 },
      stone: { amount: 3, tool: ["pickaxe"] },
      silver: { amount: 1, tool: ["pickaxe"], chance: 0.6 },
      gold: { amount: 1, chance: 0.45 },
      meat: { amount: 2, tool: ["bow", "crossbow"] },
      food: { amount: 3 },
    };
    const helperRole = {
      wood: "lumberjack",
      stone: "miner",
      silver: "miner",
      gold: "miner",
      meat: "hunter",
      food: "gatherer",
    };
    const y = yields[data.resource];
    if (!y) throw Error("There is nothing like that to gather.");
    if (!(s.workers || []).length) throw Error("You have no workers to send.");
    if (s.tick < (s.gatherReadyAt || 0))
      throw Error("Your workers are still catching their breath.");
    if (y.tool && !y.tool.some((t) => (s.inventory || []).includes(t)))
      throw Error(`The worker needs a ${y.tool.join(" or ")} for that.`);
    let gained = 0;
    if (!y.chance || Math.random() < y.chance) {
      gained =
        y.amount +
        Math.floor(
          (s.workers || []).filter((w) => w.role === helperRole[data.resource])
            .length / 3,
        );
      const storage =
        4000 +
        s.buildings.filter((b) => b.type === "storage" && !b.readyAt).length *
          2000;
      s.resources[data.resource] = Math.min(
        storage,
        (s.resources[data.resource] || 0) + gained,
      );
    }
    s.gatherReadyAt = s.tick + 3;
    if (Math.random() < 0.08) {
      const item = FOUND_ITEMS[Math.floor(Math.random() * FOUND_ITEMS.length)];
      s.inventory.push(item);
      event(
        s,
        `While gathering, a worker found ${item.replace(/_/g, " ")}.`,
        "success",
      );
    }
    event(
      s,
      gained
        ? `Gathered ${gained} ${data.resource} by hand.`
        : `The search for ${data.resource} came up empty this time.`,
    );
  } else if (type === "hire") {
    if (population(s) + 1 > capacity(s))
      throw Error("No room in camp. Build a mini-house first.");
    pay(s, { food: 30, meat: 10 });
    const gender = Math.random() < 0.5 ? "f" : "m";
    const name = `${VILLAGER_NAMES[Math.floor(Math.random() * VILLAGER_NAMES.length)]} ${
      ["of the glade", "the quiet", "of the river", "the elder", "of the hill"][
        Math.floor(Math.random() * 5)
      ]
    }`;
    s.workers.push(makeWorker(name, "worker", gender));
    event(s, `${name} joins your camp as a poor worker.`, "success");
  } else if (type === "assign") {
    const w = (s.workers || []).find((v) => v.id === data.workerId);
    if (!w) throw Error("No such villager.");
    if (w.role === "commander" || data.role === "commander")
      throw Error("The realm's commander cannot be reassigned.");
    const role = WORKER_ROLES[data.role];
    if (!role) throw Error("No such role.");
    if (role.female && w.gender !== "f")
      throw Error(`${role.name} is a role held by the women of the camp.`);
    if (
      role.requires === "hut" &&
      !s.buildings.some((b) => b.type === "hut" && !b.readyAt)
    )
      throw Error("Build a mini-house first.");
    if (
      role.requires === "farm" &&
      !s.buildings.some((b) => b.type === "farm" && !b.readyAt)
    )
      throw Error("Build a farm first.");
    w.role = data.role;
    event(s, `${w.name} takes up the role of ${role.name}.`);
  } else if (type === "coronate") {
    if (s.mode === "starter")
      throw Error("Only a realm forged from nothing can crown its founder.");
    if (!["king", "tyrant"].includes(data.path))
      throw Error("Choose a path: king or tyrant.");
    if (s.hero?.path) throw Error("Your path is already chosen.");
    if (
      population(s) < 25 ||
      !s.buildings.some((b) => b.id === "capital" && !b.readyAt)
    )
      throw Error(
        "Only a thriving settlement (25 folk) with a town center can crown its founder.",
      );
    const capitalName = CIVILIZATIONS.find(
      (c) => c.id === s.civilization,
    ).capital;
    s.hero.path = data.path;
    if (data.path === "king") {
      s.hero.rank = "King";
      s.hero.title = `King of ${capitalName}`;
      event(
        s,
        "The people crown their founder King. Hope lifts all production by 10%.",
        "success",
      );
    } else {
      s.hero.rank = "Tyrant Lord";
      s.hero.title = `Tyrant Lord of ${capitalName}`;
      event(
        s,
        "The poor worker of old seizes the crown by fear. The Tyrant Lord's armies strike 15% harder.",
        "success",
      );
    }
  } else if (type === "pause") {
    s.paused = !s.paused;
  } else if (type === "claim") {
    if (s.mode !== "story")
      throw Error("Chapter rewards are available in Story Mode.");
    if (s.chapter > 0 && !s.kingdomAwakened)
      throw Error("Found a kingdom before the next story chapter.");
    const ch = s.chapter;
    let valid =
      ch === 0
        ? s.constructed.includes("farm") && s.recruited > 0
        : ch === 1
          ? s.sites[0]?.owner === "player"
          : s.sites[1]?.owner === "player";
    if (!valid || ch > 2) throw Error("Complete the chapter objectives first.");
    s.completedChapters.push(ch);
    s.chapter++;
    s.resources.gold += [200, 350, 600][ch];
    event(s, `Chapter ${ch + 1} complete. Your legend grows.`, "success");
  } else throw Error("Unknown command.");
  s.updatedAt = Date.now();
  return s;
}
export function step(s) {
  if (s.paused || s.outcome) return;
  s.tick++;
  const rs = rates(s);
  const storage =
    4000 +
    s.buildings.filter((b) => b.type === "storage" && !b.readyAt).length * 2000;
  for (const k of Object.keys(rs))
    s.resources[k] = Math.min(storage, s.resources[k] + rs[k]);
  for (const b of s.buildings)
    if (b.readyAt && b.readyAt <= s.tick) {
      b.readyAt = 0;
      event(
        s,
        `${BUILDINGS.find((t) => t.id === b.type).name} completed.`,
        "success",
      );
    }
  if (
    !s.kingdomAwakened &&
    s.buildings.some((b) => b.id === "capital" && !b.readyAt) &&
    s.buildings.filter((b) => !b.readyAt).length >= 4 &&
    population(s) >= 12
  ) {
    s.kingdomAwakened = true;
    s.kingdomAwakenedAt = s.tick;
    s.sites = initialSites.map((site) => ({ ...site }));
    const faction = CIVILIZATIONS.findIndex((c) => c.id === s.civilization);
    s.armies.push(
      makeArmy(`unit-${3 + (faction % 3)}-0`, 24, 1, true, "guard"),
      makeArmy(`unit-${3 + (faction % 3)}-1`, 30, -23, true, "guard2"),
      makeArmy(`unit-${3 + (faction % 3)}-2`, 35, -27, true, "guard3"),
    );
    event(
      s,
      "Your growing settlement draws the attention of rival kingdoms. Scouts report enemy forces across the river.",
      "danger",
    );
  }
  if (s.research && s.research.readyAt <= s.tick) {
    const id = s.research.id;
    s.technologies.push(id);
    s.research = null;
    if (id === "masonry")
      s.buildings.forEach((b) => {
        b.maxHp = Math.round(b.maxHp * 1.4);
        b.hp = b.maxHp;
      });
    event(
      s,
      `${TECHNOLOGIES.find((t) => t.id === id).name} discovered.`,
      "success",
    );
  }
  for (const q of s.recruiting.filter((q) => q.readyAt <= s.tick)) {
    const army = makeArmy(
      q.character,
      -16 + Math.random() * 6,
      15 + Math.random() * 3,
    );
    army.formation = s.formation;
    s.armies.push(army);
    s.recruited++;
    event(s, "A new cohort stands ready.", "success");
  }
  s.recruiting = s.recruiting.filter((q) => q.readyAt > s.tick);
  if (
    (s.workers || []).length &&
    s.tick % 45 === 0 &&
    s.resources.food >= 40 &&
    s.workers.some((w) => w.role === "homemaker") &&
    population(s) < capacity(s)
  ) {
    s.resources.food -= 20;
    const gender = Math.random() < 0.5 ? "f" : "m";
    const name = `${VILLAGER_NAMES[Math.floor(Math.random() * VILLAGER_NAMES.length)]} ${
      ["of the glade", "the quiet", "of the river", "the elder", "of the hill"][
        Math.floor(Math.random() * 5)
      ]
    }`;
    s.workers.push(makeWorker(name, "worker", gender));
    event(
      s,
      `Drawn by smoke and song, ${name} settles in your camp.`,
      "success",
    );
  }
  const truce = s.truceUntil > s.tick;
  if (!truce) s.diplomacy = "war";
  // Enemies reinforce defended territory and send increasingly varied raiding parties.
  if (
    !truce &&
    s.tick >= GAME_RULES.raidGracePeriod &&
    s.tick % GAME_RULES.raidInterval === 0 &&
    s.kingdomAwakened &&
    s.sites[1]?.owner === "enemy" &&
    s.armies.filter((a) => a.enemy).length < 10 &&
    s.buildings.some((b) => b.id === "capital") &&
    (s.mode === "starter" || population(s) >= 12)
  ) {
    const f =
      3 +
      (((CIVILIZATIONS.findIndex((c) => c.id === s.civilization) % 3) + 3) % 3);
    const wave = Math.floor(s.tick / 75);
    const role = s.tick > 300 ? [2, 4, 3, 5, 6, 7, 8][wave % 7] : wave % 2;
    const a = makeArmy(`unit-${f}-${role}`, 32, -25, true);
    a.level = 1 + Math.min(3, Math.floor(s.tick / 240));
    s.armies.push(a);
    route(a, -15, 7);
    event(s, "Scouts report an Ironbound raiding party.", "danger");
  }
  for (const a of s.armies) {
    if (a.hp <= 0) continue;
    const c = CHARACTERS.find((c) => c.id === a.character);
    a.cooldown = Math.max(0, a.cooldown - 1);
    const enemies = s.armies
      .filter((b) => b.enemy !== a.enemy && b.hp > 0)
      .sort((b, d) => dist(a, b) - dist(a, d));
    const target = !truce
      ? enemies.find(
          (b) =>
            dist(a, b) <=
            c.range +
              1 +
              (!a.enemy &&
              a.formation === "archer" &&
              ["Archer", "Crossbowman"].includes(c.class)
                ? 2
                : 0),
        )
      : null;
    if (target) {
      a.status = "Fighting";
      if (!a.cooldown) {
        const tc = CHARACTERS.find((c) => c.id === target.character);
        let atk = c.attack * 2.5 * (1 + (a.level - 1) * 0.12);
        if (a.formation === "line" && c.class === "Infantry") atk *= 1.1;
        if (a.formation === "spear" && c.class === "Spearman") atk *= 1.2;
        if (!a.enemy)
          atk *=
            1 +
            (s.technologies.includes("forging") ? 0.2 : 0) +
            (s.technologies.includes("steel") ? 0.2 : 0) +
            (s.hero?.path === "tyrant" ? 0.15 : 0);
        if (
          c.class === "Spearman" &&
          tc.class.toLowerCase().includes("cavalry")
        )
          atk *= 1.8;
        if (
          c.class.toLowerCase().includes("cavalry") &&
          ["Archer", "Crossbowman"].includes(tc.class)
        )
          atk *= 1.4;
        let defense = tc.defense * (target.formation === "defensive" ? 1.4 : 1);
        if (!target.enemy) {
          if (s.technologies.includes("armor")) defense *= 1.25;
          if (s.civilization === "aurelia" && tc.class === "Infantry")
            defense *= 1.15;
        }
        target.hp -= Math.max(5, atk - defense);
        a.cooldown = Math.ceil(c.attackSpeed);
        a.lastAttack = s.tick;
        a.attackTarget = target.id;
        target.lastHit = s.tick;
        if (target.hp <= 0) {
          a.xp += 50;
          if (!a.enemy) {
            s.kills++;
            a.level = 1 + Math.floor(a.xp / 100);
          }
          event(
            s,
            `${target.enemy ? "Enemy" : "Your"} ${target.name.toLowerCase()} defeated.`,
            target.enemy ? "success" : "danger",
          );
        }
      }
    } else {
      if (a.enemy && !truce && enemies[0] && dist(a, enemies[0]) < 12) {
        if (a.hp < a.maxHp * 0.2 && s.sites[1]?.owner === "enemy")
          route(a, 32, -27);
        else if (a.status !== "Marching") route(a, enemies[0].x, enemies[0].z);
      }
      if (a.path.length) {
        const p = a.path[0],
          d = dist(a, p),
          speed =
            c.speed *
            (!a.enemy && s.technologies.includes("logistics") ? 1.25 : 1) *
            (a.formation === "defensive"
              ? 0.7
              : a.formation === "cavalry" &&
                  c.class.toLowerCase().includes("cavalry")
                ? 1.3
                : 1) *
            0.7;
        a.status = "Marching";
        if (d <= speed) {
          a.x = p.x;
          a.z = p.z;
          a.path.shift();
        } else {
          a.x += ((p.x - a.x) / d) * speed;
          a.z += ((p.z - a.z) / d) * speed;
        }
      } else if (a.status !== "Holding") {
        a.status = "Idle";
        a.target = null;
      }
    }
    if (
      !a.enemy &&
      s.technologies.includes("medicine") &&
      dist(a, { x: -15, z: 7 }) < 12
    )
      a.hp = Math.min(a.maxHp, a.hp + 5);
  }
  for (const w of s.workers || []) {
    if (!w.path?.length) continue;
    const p = w.path[0],
      d = dist(w, p),
      speed = 0.28;
    w.status = "Marching";
    if (d <= speed) {
      w.x = p.x;
      w.z = p.z;
      w.path.shift();
    } else {
      w.x += ((p.x - w.x) / d) * speed;
      w.z += ((p.z - w.z) / d) * speed;
    }
    if (!w.path.length) {
      w.target = null;
      w.status = "Idle";
    }
  }
  const campArchers = (s.workers || []).filter(
    (w) => w.role === "archer",
  ).length;
  if (campArchers && !truce) {
    for (const a of s.armies.filter(
      (v) => v.enemy && v.hp > 0 && dist(v, { x: -15, z: 7 }) < 10,
    )) {
      a.hp -= campArchers * 1.5;
      a.lastHit = s.tick;
      if (a.hp <= 0) {
        s.kills++;
        event(
          s,
          `Camp archers bring down the ${a.name.toLowerCase()}.`,
          "success",
        );
      }
    }
  }
  s.armies = s.armies.filter((a) => a.hp > 0);
  for (const site of s.sites.filter((t) => t.owner !== "player")) {
    const friend = s.armies.filter((a) => !a.enemy && dist(a, site) < 8);
    const guard = s.armies.some((a) => a.enemy && dist(a, site) < 10);
    if (friend.length && !guard && (site.owner === "neutral" || !truce)) {
      site.hp -= friend.reduce(
        (v, a) =>
          v +
          (CHARACTERS.find((c) => c.id === a.character).class === "Engineer"
            ? a.formation === "siege"
              ? 145
              : 110
            : 28),
        0,
      );
      if (site.hp <= 0) {
        site.owner = "player";
        site.hp = site.maxHp;
        s.resources.gold += site.reward;
        s.resources.wood += 200;
        s.victories++;
        event(s, `${site.name} is now part of your empire!`, "success");
      }
    }
  }
  for (const b of s.buildings) {
    const attackers = !truce
      ? s.armies.filter((a) => a.enemy && dist(a, b) < 5)
      : [];
    b.hp -= attackers.length * 12;
    if (b.type === "tower" && !b.readyAt && !truce) {
      const a = s.armies.find((a) => a.enemy && dist(a, b) < 13);
      if (a) a.hp -= s.technologies.includes("fortification") ? 48 : 24;
    }
  }
  const capital = s.buildings.find((b) => b.id === "capital");
  if (capital && capital.hp <= 0) {
    s.outcome = "defeat";
    s.defeats++;
    event(s, "The capital has fallen. A new dawn will come.", "danger");
  } else if (
    !capital &&
    s.mode !== "starter" &&
    !(s.workers || []).length &&
    !s.armies.some((a) => !a.enemy)
  ) {
    s.outcome = "defeat";
    s.defeats++;
    event(
      s,
      "The last worker has fallen in the forest. The dream ends unread.",
      "danger",
    );
  }
  s.buildings = s.buildings.filter((b) => b.hp > 0);
  if (
    s.sites.length > 0 &&
    s.sites.every((t) => t.owner === "player") &&
    s.armies.every((a) => !a.enemy)
  ) {
    s.outcome = "victory";
    event(s, "The valley is united. Your empire has risen.", "success");
  }
  s.updatedAt = Date.now();
}
