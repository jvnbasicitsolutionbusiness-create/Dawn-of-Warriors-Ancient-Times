import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createSpriteSheet } from "./sprites.js";
export const riverX = (z) => 12 + Math.sin(z / 14) * 5;
const materials = new Map(),
  geometries = new Map();
const mat = (color, extra = {}) => {
  const k = color + JSON.stringify(extra);
  if (!materials.has(k))
    materials.set(
      k,
      new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra }),
    );
  return materials.get(k);
};
const boxGeo = (x, y, z) => {
  const k = `b${x},${y},${z}`;
  if (!geometries.has(k)) geometries.set(k, new THREE.BoxGeometry(x, y, z));
  return geometries.get(k);
};
export function box(g, x, y, z, w, h, d, color, rot = 0) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.rotation.y = rot;
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function cone(g, x, y, z, r, h, color, sides = 6) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, sides), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}
function cylinder(g, x, y, z, r, h, color, sides = 8) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, sides),
    mat(color),
  );
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  g.add(m);
  return m;
}
function roof(g, x, y, z, w, d, color = "#a76040") {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(0, w * 0.34);
  shape.lineTo(w / 2, 0);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
  });
  const m = new THREE.Mesh(geom, mat(color));
  m.position.set(x, y, z - d / 2);
  m.castShadow = true;
  g.add(m);
  return m;
}
export function height(x, z) {
  const r = Math.abs(x - riverX(z));
  let h = 0.3 + Math.sin(x * 0.15) * Math.cos(z * 0.14) * 0.3;
  if (r < 5) h = 0.1 + (r / 5) * 0.2;
  const mountains =
    Math.max(0, -z - 27) * 0.37 + Math.max(0, Math.abs(x) - 42) * 0.15;
  return h + mountains * (0.6 + Math.sin(x * 0.26) * 0.4);
}
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function ribbon(points, width, color, y = 0.06) {
  const verts = [],
    idx = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      n = points[Math.min(i + 1, points.length - 1)],
      prev = points[Math.max(i - 1, 0)];
    let dx = n.x - prev.x,
      dz = n.z - prev.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    for (const side of [-1, 1]) {
      const x = p.x + ((dz * width) / 2) * side,
        z = p.z - ((dx * width) / 2) * side;
      verts.push(x, height(x, z) + y, z);
    }
    if (i < points.length - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide }));
  m.receiveShadow = true;
  return m;
}
export function makeWorld(scene, region = "aurelia", quality = "High") {
  const world = new THREE.Group();
  scene.add(world);
  const desert = region === "ashur",
    asian = region === "shen";
  const rand = rng(91);
  const ground = new THREE.PlaneGeometry(230, 190, 160, 140);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position,
    colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i);
    pos.setY(i, height(x, z));
    const variation = rand();
    c.set(desert ? "#b8a77c" : asian ? "#718b5d" : "#849667");
    c.offsetHSL(
      (variation - 0.5) * 0.04,
      (variation - 0.5) * 0.09,
      (variation - 0.5) * 0.035,
    );
    if (Math.abs(x - riverX(z)) < 5)
      c.lerp(new THREE.Color(desert ? "#b1aa83" : "#91a888"), 0.4);
    colors.push(c.r, c.g, c.b);
  }
  ground.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  ground.computeVertexNormals();
  const land = new THREE.Mesh(
    ground,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  land.receiveShadow = true;
  land.userData.terrain = true;
  world.add(land);
  const river = [];
  for (let z = -58; z <= 58; z += 1) river.push({ x: riverX(z), z });
  world.add(ribbon(river, 7.5, desert ? "#bdb59a" : "#a9b18e", 0.04));
  const water = ribbon(river, 5.3, "#689e9d", 0.16);
  water.material = new THREE.MeshStandardMaterial({
    color: "#447e82",
    roughness: 0.28,
    metalness: 0.23,
    transparent: true,
    opacity: 0.91,
    side: THREE.DoubleSide,
  });
  world.add(water);
  const paths = [
    [
      { x: -34, z: 28 },
      { x: -22, z: 17 },
      { x: -15, z: 7 },
      { x: 3, z: 3 },
      { x: 13, z: 3 },
      { x: 26, z: 1 },
      { x: 32, z: -29 },
    ],
    [
      { x: -15, z: 7 },
      { x: -23, z: -3 },
      { x: -29, z: -22 },
    ],
    [
      { x: -15, z: 7 },
      { x: -3, z: 17 },
      { x: 0, z: 36 },
    ],
  ];
  paths.forEach((p) =>
    world.add(ribbon(p, 2.4, desert ? "#c9b58c" : "#c1b796", 0.07)),
  );
  // A stone bridge spans the river, wide enough for a marching cohort.
  const bridge = new THREE.Group();
  bridge.position.set(riverX(3), 0.4, 3);
  box(bridge, 0, 0, 0, 11, 0.65, 3.6, "#c1baa1");
  box(bridge, 0, 0.65, -1.7, 11, 0.55, 0.35, "#c4bda5");
  box(bridge, 0, 0.65, 1.7, 11, 0.55, 0.35, "#c4bda5");
  for (const x of [-4, -1.4, 1.4, 4])
    for (const z of [-1.7, 1.7])
      box(bridge, x, -0.4, z, 0.65, 1.8, 0.65, "#b2ad94");
  world.add(bridge);
  const clusters = [
    [-36, 15, 11],
    [-36, -8, 10],
    [-13, -15, 12],
    [0, -28, 8],
    [41, 16, 12],
    [36, -13, 7],
    [-5, 30, 8],
    [-48, 32, 7],
    [-48, -30, 8],
  ];
  for (const [cx, cz, r] of clusters)
    for (let i = 0; i < (quality === "Low" ? 14 : 35); i++) {
      const a = rand() * Math.PI * 2,
        rr = Math.sqrt(rand()) * r,
        x = cx + Math.cos(a) * rr,
        z = cz + Math.sin(a) * rr;
      if (
        Math.abs(x - riverX(z)) < 6 ||
        paths.some((p) => p.some((q) => Math.hypot(x - q.x, z - q.z) < 4))
      )
        continue;
      const h = height(x, z),
        scale = 0.7 + rand() * 0.9;
      const tree = new THREE.Group();
      tree.position.set(x, h, z);
      tree.scale.setScalar(scale);
      if (desert) {
        cylinder(tree, 0, 0, 0, 0.12, 2.5, "#8e7958", 5);
        for (let j = 0; j < 6; j++) {
          const palm = box(
            tree,
            0,
            2.4,
            0,
            0.25,
            0.12,
            2.8,
            "#738462",
            (j * Math.PI) / 3,
          );
          palm.rotation.z = 0.2;
        }
      } else {
        cylinder(tree, 0, 0, 0, 0.13, 1.8, "#756c4e", 5);
        const tone = ["#385c43", "#466d4b", "#55734d", "#687e54"][
          Math.floor(rand() * 4)
        ];
        if (rand() > 0.62) {
          for (let j = 0; j < 3; j++) {
            const canopy = new THREE.Mesh(
              new THREE.IcosahedronGeometry(0.95, 1),
              mat(tone),
            );
            canopy.position.set(
              Math.sin(j * 2) * 0.42,
              1.6 + j * 0.3,
              Math.cos(j * 2) * 0.4,
            );
            canopy.scale.set(1, 1.12, 1);
            canopy.castShadow = true;
            tree.add(canopy);
          }
        } else {
          cone(tree, 0, 0.5, 0, 0.85, 2.4, tone, 8);
          cone(tree, 0, 1.4, 0, 0.63, 1.9, tone, 8);
        }
      }
      world.add(tree);
    }
  // Low-poly mountain ridges and scattered boulders frame the valley.
  for (let i = 0; i < 26; i++) {
    const x = -58 + i * 4.8,
      z = -44 - rand() * 7,
      y = height(x, z);
    const m = cone(
      world,
      x,
      y - 1,
      z,
      5 + rand() * 5,
      5 + rand() * 7,
      ["#8d9485", "#9da08d", "#898f82"][i % 3],
      5,
    );
    m.rotation.y = rand() * 3;
  }
  for (let i = 0; i < 110; i++) {
    const x = rand() * 112 - 56,
      z = rand() * 96 - 48;
    if (Math.hypot(x + 15, z - 7) < 19 || Math.abs(x - riverX(z)) < 5) continue;
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2 + rand() * 0.65, 0),
      mat("#9eaa94"),
    );
    m.position.set(x, height(x, z), z);
    m.scale.y = 0.7;
    m.castShadow = true;
    world.add(m);
  }
  // Farms outside the capital walls.
  for (const [x, z] of [
    [-30, 4],
    [-28, 10],
    [-22, -7],
    [-18, -6],
  ]) {
    const f = new THREE.Group();
    f.position.set(x, height(x, z) + 0.03, z);
    field(f, 0, 0, 4.5, 3.4);
    world.add(f);
  }
  // Small surrounding villas make the capital feel like a lived-in settlement.
  for (const [x, z, r] of [
    [-19, 0, 0.2],
    [-11, 0, 0],
    [-19, 17, 0.2],
    [-5, 13, 1.5],
    [-8, -1, 0.2],
    [-28, 14, 0.4],
    [-26, 19, 0.2],
    [-4, 21, 0.7],
    [-22, -4, 0],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, height(x, z), z);
    g.rotation.y = r;
    house(g, 0, 0, 1.7, 2, region);
    world.add(g);
  }
  // City wall and towers.
  const walls = new THREE.Group();
  walls.position.set(-15, height(-15, 7), 7);
  for (const x of [-12, 12]) {
    box(walls, x, 0, 0, 0.75, 1.8, 22, "#b6b59c");
    for (let z = -10; z < 12; z += 1.5)
      box(walls, x, 1.8, z, 0.85, 0.45, 0.65, "#c8c5aa");
  }
  for (const z of [-11, 11]) {
    for (const x of [-8, 8]) {
      box(walls, x, 0, z, 8, 0.0 + 1.8, 0.75, "#b6b59c");
      for (let k = -3; k <= 3; k += 1.5)
        box(walls, x + k, 1.8, z, 0.65, 0.45, 0.85, "#c8c5aa");
    }
  }
  for (const x of [-12, 12])
    for (const z of [-11, 11]) tower(walls, x, z, 2.9, region);
  world.add(walls);
  compactGroup(world, [land, water]);
  return { world, land, water };
}
function field(g, x, z, w = 4, d = 4) {
  box(g, x, 0.02, z, w, 0.1, d, "#8e8355");
  for (let i = 0; i < 8; i++) {
    box(
      g,
      x - w / 2 + 0.25 + (i * w) / 8,
      0.12,
      z,
      0.22,
      0.22,
      d - 0.3,
      i % 2 ? "#b7a265" : "#c7b979",
    );
  }
  for (const xx of [-w / 2, w / 2])
    for (const zz of [-d / 2, d / 2])
      box(g, x + xx, 0, z + zz, 0.12, 0.6, 0.12, "#877451");
}
function house(g, x, z, w = 2, d = 2, region = "aurelia") {
  const stone = region === "ashur" ? "#c7b087" : "#d2c8ac";
  box(g, x, 0, z, w, 1.65, d, stone);
  if (region === "ashur") {
    box(g, x, 1.65, z, w + 0.2, 0.2, d + 0.2, "#b3966d");
  } else
    roof(
      g,
      x,
      1.65,
      z,
      w + 0.35,
      d + 0.35,
      region === "shen" ? "#52675c" : "#ac7050",
    );
  box(g, x, 0.2, z + d / 2 + 0.01, 0.42, 0.9, 0.05, "#5b635b");
  box(g, x + 0.55, 0.75, z + d / 2 + 0.04, 0.35, 0.45, 0.06, "#717466");
}
function banner(g, x, y, z, color = "#447383") {
  const pole = cylinder(g, x, y, z, 0.055, 2.7, "#8d7953", 6);
  const flag = box(g, x + 0.4, y + 1.65, z, 0.8, 0.75, 0.045, color);
  return { pole, flag };
}
function tower(g, x, z, h = 3, region = "aurelia", enemy = false) {
  box(g, x, 0, z, 1.9, h, 1.9, region === "ashur" ? "#bca17b" : "#bdbca5");
  box(g, x, h - 0.2, z, 2.25, 0.35, 2.25, "#cfccb2");
  for (const xx of [-0.8, 0.8])
    for (const zz of [-0.8, 0.8])
      box(g, x + xx, h + 0.15, z + zz, 0.55, 0.5, 0.55, "#c6c4aa");
  box(g, x, h * 0.6, z + 1, 0.3, 0.6, 0.04, "#626c65");
  banner(g, x, h + 0.1, z, enemy ? "#974f43" : "#416d7b");
}
export function buildingModel(type, region = "aurelia", enemy = false) {
  const g = new THREE.Group();
  const stone = region === "ashur" ? "#cbb48b" : "#d6cdb3";
  const roofColor =
    region === "shen" ? "#526f65" : enemy ? "#725f54" : "#a96445";
  if (type === "towncenter" || type === "palace") {
    box(g, 0, 0, 0, 6, 0.35, 5, "#c6c1a9");
    box(g, 0, 0.35, 0, 5, 0.35, 4.4, "#ded5ba");
    box(g, 0, 0.7, 0, 3.8, 2.8, 3.3, stone);
    for (const x of [-2.25, -1.35, 1.35, 2.25])
      for (const z of [-1.9, 1.9]) {
        cylinder(g, x, 0.7, z, 0.17, 2.7, "#e0d5b5", 8);
        box(g, x, 0.65, z, 0.5, 0.2, 0.5, "#c5b998");
      }
    box(g, 0, 3.4, 0, 5.3, 0.3, 4.5, "#d8ccb0");
    roof(g, 0, 3.7, 0, 5.8, 4.9, roofColor);
    box(g, 0, 0.3, 2.8, 3, 0.25, 1.1, "#c8bea3");
    box(g, 0, 0.0, 3.2, 3.5, 0.2, 1, "#bab39c");
    banner(g, 0, 5.1, 0);
    for (const x of [-3, 3]) {
      box(g, x, 0, -1, 1.4, 1.9, 3, stone);
      roof(g, x, 1.9, -1, 1.7, 3.3, roofColor);
    }
  } else if (type === "farm") {
    field(g, 0, 0, 5, 4);
    house(g, 1.5, -2.8, 1.8, 1.6, region);
    box(g, -2, 0.2, -2.8, 1, 0.8, 1, "#b99a61");
  } else if (type === "tower") {
    tower(g, 0, 0, 4, region, enemy);
  } else if (type === "wall") {
    box(g, 0, 0, 0, 5, 2.4, 0.9, stone);
    for (let i = -2; i <= 2; i++) box(g, i, 2.4, 0, 0.6, 0.5, 1, stone);
  } else if (type === "quarry" || type === "goldmine") {
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.3),
        mat(type === "goldmine" ? "#a99e70" : "#a3a799"),
      );
      m.position.set(Math.sin(i * 2) * 1.8, 0.5, Math.cos(i * 2) * 1.3);
      g.add(m);
    }
    box(g, 0, 0, 0, 1.5, 1.8, 1, "#746b55");
    box(g, 0, 0.1, 0.6, 1, 1.2, 0.1, "#363d35");
    house(g, 2, 1, 1.2, 1.5, region);
  } else if (type === "lumber") {
    house(g, 0, 0, 2.5, 2.5, region);
    for (let i = 0; i < 7; i++) {
      const log = cylinder(
        g,
        -2 + (i % 3) * 0.4,
        0.2 + Math.floor(i / 3) * 0.3,
        1,
        0.2,
        2,
        "#8b7050",
      );
      log.rotation.z = Math.PI / 2;
    }
  } else if (type === "barracks" || type === "archery" || type === "stable") {
    box(g, 0, 0, 0, 4.5, 0.12, 4, "#a7a388");
    house(g, 0, -0.7, 3.6, 2, region);
    for (const x of [-2, 2]) box(g, x, 0, 0.8, 0.18, 1.6, 0.18, "#826e51");
    banner(g, 1.8, 1.4, -1.2);
    if (type === "archery") {
      for (let x = -1; x <= 1; x++) {
        const target = cylinder(g, x, 0.8, 1.5, 0.4, 0.12, "#c8ad74");
        target.rotation.x = Math.PI / 2;
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const tent = cone(g, -1.2 + i * 1.2, 0.1, 1.5, 0.7, 1.2, "#aaa486", 4);
        tent.rotation.y = Math.PI / 4;
      }
    }
  } else if (type === "harbor") {
    box(g, 0, 0.2, 0, 5, 0.3, 4, "#9a8059");
    house(g, 0, -1, 2.2, 2, region);
    for (let i = -2; i <= 2; i++)
      box(g, i, -0.5, 1.5, 0.18, 1.5, 0.18, "#76684c");
  } else {
    house(g, 0, 0, 3.4, 3, region);
    if (["research", "academy"].includes(type)) {
      cylinder(g, 0, 1.5, 0, 1.6, 1.5, stone, 8);
      cone(g, 0, 3, 0, 1.8, 1.2, "#87998a", 8);
      banner(g, 0, 3.8, 0);
    }
    if (type === "blacksmith" || type === "siege")
      box(g, 1.3, 0, -1, 1, 3.2, 1, "#9d9e8a");
    if (type === "market") {
      for (const x of [-2.7, 2.7]) {
        box(g, x, 0, 0, 1.6, 0.8, 2, "#a89169");
        roof(g, x, 1.6, 0, 2, 2.2, "#b9b494");
      }
    }
  }
  if (enemy) banner(g, 2, 2, 0, "#9f5644");
  compactGroup(g);
  return g;
}
export function fortModel(region, large = false, enemy = true) {
  const g = new THREE.Group();
  g.add(buildingModel(large ? "towncenter" : "barracks", region, enemy));
  const r = large ? 5 : 3.8;
  for (const x of [-r, r])
    for (const z of [-r, r]) tower(g, x, z, large ? 4 : 2.8, region, enemy);
  for (const x of [-r, r]) box(g, x, 0, 0, 0.7, 2, r * 2, "#a9ab96");
  box(g, 0, 0, -r, r * 2, 2, 0.7, "#a9ab96");
  for (const x of [-r / 1.5, r / 1.5])
    box(g, x, 0, r, r * 0.7, 2, 0.7, "#a9ab96");
  compactGroup(g);
  return g;
}
export function armyModel(character, enemy = false, formation = "line") {
  const g = new THREE.Group();
  const palette = enemy ? ["#8a3c31", "#d9b38a"] : ["#446d7f", "#d6c09d"];
  const kind = character.class.toLowerCase().includes("cavalry")
    ? "cavalry"
    : ["Archer", "Crossbowman"].includes(character.class)
      ? "archer"
      : "guardian";
  const sheet = createSpriteSheet(kind, palette, 4, 128);
  if (sheet.canvas) {
    const texture = new THREE.CanvasTexture(sheet.canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.12,
        depthWrite: false,
      }),
    );
    sprite.scale.set(2.9, 3.2, 1);
    sprite.position.y = 1.1;
    g.add(sprite);
  } else {
    const cavalry = character.class.toLowerCase().includes("cavalry");
    const color = enemy ? "#974e43" : "#447f93";
    for (let i = 0; i < 6; i++) {
      const soldier = new THREE.Group();
      const positions = {
        line: [((i % 3) - 1) * 0.65, (Math.floor(i / 3) - 0.5) * 0.85],
        defensive: [
          Math.sin((i * Math.PI) / 3) * 1.05,
          Math.cos((i * Math.PI) / 3) * 1.05,
        ],
        spear: [((i % 3) - 1) * 0.5, Math.floor(i / 3) * 1.1],
        cavalry: [
          (i % 2 ? 1 : -1) * Math.floor((i + 1) / 2) * 0.55,
          Math.floor((i + 1) / 2) * 0.7,
        ],
        archer: [((i % 3) - 1) * 1.15, Math.floor(i / 3) * 1.25],
        siege: [((i % 3) - 1) * 1.1, Math.floor(i / 3) * 1.4],
      };
      const p = positions[formation] || positions.line;
      soldier.position.set(p[0], 0, p[1]);
      if (cavalry) {
        box(soldier, 0, 0.3, 0, 0.38, 0.45, 0.8, "#77674e");
        for (const x of [-0.15, 0.15])
          for (const z of [-0.25, 0.25])
            box(soldier, x, 0, z, 0.1, 0.4, 0.1, "#514d40");
        box(soldier, 0, 0.65, -0.4, 0.25, 0.4, 0.3, "#77674e");
      }
      const y = cavalry ? 0.7 : 0;
      box(soldier, 0, y + 0.25, 0, 0.33, 0.44, 0.26, color);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 6, 5),
        mat("#bba986"),
      );
      head.position.set(0, y + 0.85, 0);
      soldier.add(head);
      cone(soldier, 0, y + 0.88, 0, 0.19, 0.22, "#b3a582", 6);
      box(soldier, 0.23, y + 0.2, 0, 0.12, 0.9, 0.1, "#8b805e");
      if (character.class === "Spearman")
        box(soldier, 0.23, y + 0.4, 0, 0.05, 1.6, 0.05, "#a7aa9e");
      else if (["Archer", "Crossbowman"].includes(character.class)) {
        const bow = box(
          soldier,
          0.28,
          y + 0.4,
          -0.2,
          0.06,
          0.65,
          0.08,
          "#786847",
        );
        bow.rotation.x = 0.2;
      } else box(soldier, -0.23, y + 0.3, -0.05, 0.12, 0.48, 0.38, "#9d9c82");
      g.add(soldier);
    }
  }
  banner(g, 0, 0.4, 0, enemy ? "#974e43" : "#447f93");
  compactGroup(g);
  return g;
}
export function workerModel(role = "worker", gender = "m") {
  const g = new THREE.Group();
  const tunic =
    role === "hunter" || role === "archer"
      ? "#6b7a4f"
      : role === "miner"
        ? "#6d6a63"
        : role === "lumberjack"
          ? "#7a5f42"
          : role === "homemaker"
            ? "#8a6f86"
            : role === "farmer" || role === "gatherer"
              ? "#8a7d4f"
              : role === "builder"
                ? "#7d6b52"
                : "#7b7361";
  const skin = "#c3a077";
  box(g, 0, 0.42, 0, 0.3, 0.5, 0.24, tunic);
  for (const x of [-0.09, 0.09]) box(g, x, 0, 0, 0.11, 0.42, 0.12, "#5c5346");
  for (const x of [-0.2, 0.2]) box(g, x, 0.5, 0, 0.09, 0.4, 0.09, tunic);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 6), mat(skin));
  head.position.set(0, 1.02, 0);
  head.castShadow = true;
  g.add(head);
  if (gender === "f") {
    box(g, 0, 1.06, -0.02, 0.34, 0.2, 0.3, "#4a4038");
    box(g, 0, 0.42, 0, 0.34, 0.55, 0.27, tunic);
  } else {
    box(g, 0, 1.14, 0, 0.3, 0.1, 0.28, "#4a4038");
  }
  if (role === "lumberjack" || role === "worker")
    box(g, 0.24, 0.5, 0, 0.07, 0.75, 0.07, "#8b7050");
  else if (role === "miner")
    box(g, 0.24, 0.55, 0, 0.07, 0.6, 0.07, "#8b7050");
  else if (role === "hunter" || role === "archer") {
    const bow = box(g, 0.26, 0.6, -0.1, 0.05, 0.7, 0.06, "#786847");
    bow.rotation.x = 0.15;
  } else if (role === "farmer" || role === "gatherer")
    box(g, 0.24, 0.45, 0, 0.06, 0.7, 0.06, "#9a8257");
  else if (role === "builder") box(g, 0.24, 0.5, 0, 0.1, 0.5, 0.1, "#9d9e8a");
  compactGroup(g);
  return g;
}
export function selectionRing(radius = 2, color = "#bcccaa") {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.09, radius, 64),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.16;
  return m;
}

// Batch static architecture and vegetation by material: hundreds of props become a few dozen draw calls.
export function compactGroup(group, skip = []) {
  group.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert(),
    batches = new Map();
  group.traverse((mesh) => {
    if (!mesh.isMesh || skip.includes(mesh)) return;
    let geometry = mesh.geometry.clone();
    if (geometry.index) {
      const flat = geometry.toNonIndexed();
      geometry.dispose();
      geometry = flat;
    }
    geometry.applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld),
    );
    if (!geometry.attributes.uv)
      geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
          new Float32Array(geometry.attributes.position.count * 2),
          2,
        ),
      );
    const material = mesh.material;
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
  });
  for (const child of [...group.children])
    if (!skip.includes(child)) group.remove(child);
  for (const [material, list] of batches) {
    const geometry = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}
