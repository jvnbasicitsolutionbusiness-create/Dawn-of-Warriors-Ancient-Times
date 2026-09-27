import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import {
  makeWorld,
  buildingModel,
  armyModel,
  fortModel,
  selectionRing,
  height,
  riverX,
} from "../game/scene";
import { CHARACTERS, CIVILIZATIONS } from "../../shared/catalog";

export default forwardRef(function Battlefield(
  { game, selected, placing, onSelect, onMove, onBuild, settings, onReady },
  ref,
) {
  const host = useRef(),
    runtime = useRef(),
    latest = useRef({
      game,
      selected,
      placing,
      onSelect,
      onMove,
      onBuild,
      settings,
    });
  latest.current = {
    game,
    selected,
    placing,
    onSelect,
    onMove,
    onBuild,
    settings,
  };
  useImperativeHandle(ref, () => ({
    zoom(d) {
      if (runtime.current) {
        runtime.current.camera.zoom = THREE.MathUtils.clamp(
          runtime.current.camera.zoom + d,
          0.55,
          2.4,
        );
        runtime.current.camera.updateProjectionMatrix();
      }
    },
    home() {
      if (runtime.current) runtime.current.target.set(-4, 0, 0);
    },
    focus(x, z) {
      runtime.current?.target.set(x, 0, z);
    },
    rotate(d) {
      if (runtime.current) runtime.current.angle += d;
    },
  }));
  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      el.innerHTML =
        '<div class="webgl-error">This strategy map needs WebGL. Enable hardware acceleration and reload to play.</div>';
      return;
    }
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, settings.graphics === "High" ? 2 : 1.25),
    );
    renderer.shadowMap.enabled = settings.graphics !== "Low";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      game.civilization === "ashur" ? "#b5b29c" : "#9aa995",
    );
    scene.fog = new THREE.Fog(scene.background, 100, 190);
    const camera = new THREE.OrthographicCamera(-50, 50, 35, -35, 0.1, 240);
    const target = new THREE.Vector3(-4, 0, 0);
    const rt = {
      camera,
      target,
      angle: 0.27,
      models: new Map(),
      labels: new Map(),
      renderer,
    };
    runtime.current = rt;
    scene.add(new THREE.HemisphereLight("#f4ebd2", "#6e806b", 1.9));
    const sun = new THREE.DirectionalLight("#ffe6b8", 2.6);
    sun.position.set(-40, 70, -25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.camera.far = 170;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.15;
    scene.add(sun);
    const { world, land, water } = makeWorld(
      scene,
      game.civilization,
      settings.graphics,
    );
    const effects = [],
      dying = [];
    const entities = new THREE.Group();
    scene.add(entities);
    const labels = document.createElement("div");
    labels.className = "map-labels";
    el.appendChild(labels);
    const ghost = new THREE.Group();
    ghost.visible = false;
    scene.add(ghost);
    const ghostBase = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({
        color: "#b6d7b1",
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ghostBase.rotation.x = -Math.PI / 2;
    ghost.add(ghostBase);
    const destination = selectionRing(1.3, "#e6d6a0");
    destination.visible = false;
    scene.add(destination);
    let destinationAt = 0;
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      const aspect = w / h;
      camera.left = -34 * aspect;
      camera.right = 34 * aspect;
      camera.top = 34;
      camera.bottom = -34;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    function ray(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    }
    function point(e) {
      ray(e);
      return raycaster.intersectObject(land)[0]?.point;
    }
    let down = null,
      moved = false;
    const keys = new Set();
    const pointerDown = (e) => {
      if (e.target !== renderer.domElement) return;
      down = { x: e.clientX, y: e.clientY, button: e.button };
      moved = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e) => {
      if (latest.current.placing) {
        const p = point(e);
        if (p) {
          ghost.visible = true;
          ghost.position.set(p.x, p.y + 0.2, p.z);
          const s = latest.current.game;
          const valid =
            [
              { x: -15, z: 7 },
              ...s.sites.filter((t) => t.owner === "player"),
            ].some((t) => Math.hypot(t.x - p.x, t.z - p.z) < 19) &&
            Math.abs(p.x - riverX(p.z)) > 3 &&
            !s.buildings.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < 5);
          ghostBase.material.color.set(valid ? "#a8d4b3" : "#e28c7e");
        }
      } else ghost.visible = false;
      if (down) {
        const dx = e.clientX - down.x,
          dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        if (down.button === 1) {
          rt.angle -= dx * 0.007;
        } else if (down.button === 0 && !latest.current.placing) {
          const speed = 0.085 / camera.zoom;
          target.x -=
            dx * Math.cos(rt.angle) * speed + dy * Math.sin(rt.angle) * speed;
          target.z +=
            dx * Math.sin(rt.angle) * speed - dy * Math.cos(rt.angle) * speed;
        }
        down.x = e.clientX;
        down.y = e.clientY;
      }
    };
    const pointerUp = (e) => {
      if (down && !moved) {
        const p = point(e);
        if (p) {
          const l = latest.current;
          if (l.placing && e.button === 0) {
            l.onBuild(l.placing, p.x, p.z);
          } else if (e.button === 2) {
            l.onMove(p.x, p.z);
            destination.position.set(p.x, p.y + 0.25, p.z);
            destination.visible = true;
            destinationAt = performance.now();
          } else {
            ray(e);
            const hits = raycaster.intersectObjects(entities.children, true);
            let found;
            for (const h of hits) {
              let obj = h.object;
              while (obj && !obj.userData.entity) obj = obj.parent;
              if (obj?.userData.entity) {
                found = obj.userData.entity;
                break;
              }
            }
            l.onSelect(found || null, e.shiftKey);
          }
        }
      }
      down = null;
    };
    const wheel = (e) => {
      e.preventDefault();
      camera.zoom = THREE.MathUtils.clamp(
        camera.zoom - e.deltaY * 0.001,
        0.55,
        2.4,
      );
      camera.updateProjectionMatrix();
    };
    const context = (e) => e.preventDefault();
    const keydown = (e) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        ) ||
        document.querySelector(".modal-backdrop")
      )
        return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "q",
          "e",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.add(e.key.toLowerCase());
      }
      if (e.key === "Escape") latest.current.onSelect(null);
    };
    const keyup = (e) => keys.delete(e.key.toLowerCase());
    const blur = () => keys.clear();
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", () => {
      down = null;
    });
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    renderer.domElement.addEventListener("contextmenu", context);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    let frame,
      previousSync = -1,
      frameCount = 0;
    const projected = new THREE.Vector3();
    function addEntity(id, model, data, labelText, labelClass) {
      model.userData.entity = data;
      const ring = selectionRing(
        data.kind === "army" ? 2 : 4,
        data.enemy ? "#d89077" : "#d9d0a2",
      );
      model.add(ring);
      ring.visible = false;
      entities.add(model);
      const label = document.createElement("button");
      label.className = `world-label ${labelClass}`;
      label.innerHTML = `<span class="label-name">${labelText}</span><span class="map-health"><i></i></span>`;
      label.onclick = (e) => {
        e.stopPropagation();
        latest.current.onSelect(model.userData.entity, e.shiftKey);
      };
      label.onpointerdown = (e) => e.stopPropagation();
      labels.appendChild(label);
      const entry = { model, ring, label };
      rt.models.set(id, entry);
      return entry;
    }
    const animate = () => {
      frame = requestAnimationFrame(animate);
      frameCount++;
      const l = latest.current,
        g = l.game;
      const speed = (0.12 + l.settings.camera * 0.003) / camera.zoom;
      if (keys.has("w") || keys.has("arrowup")) target.z -= speed;
      if (keys.has("s") || keys.has("arrowdown")) target.z += speed;
      if (keys.has("a") || keys.has("arrowleft")) target.x -= speed;
      if (keys.has("d") || keys.has("arrowright")) target.x += speed;
      if (keys.has("q")) rt.angle += 0.012;
      if (keys.has("e")) rt.angle -= 0.012;
      target.x = THREE.MathUtils.clamp(target.x, -42, 42);
      target.z = THREE.MathUtils.clamp(target.z, -34, 34);
      camera.position.set(
        target.x + Math.sin(rt.angle) * 78,
        72,
        target.z + Math.cos(rt.angle) * 78,
      );
      camera.lookAt(target);
      const live = new Set();
      for (const b of g.buildings) {
        live.add(b.id);
        let en = rt.models.get(b.id);
        if (!en) {
          const model = buildingModel(b.type, g.civilization);
          model.position.set(b.x, height(b.x, b.z), b.z);
          en = addEntity(
            b.id,
            model,
            { kind: "building", id: b.id },
            b.id === "capital"
              ? CIVILIZATIONS.find((c) => c.id === g.civilization).capital
              : b.type === "barracks"
                ? "Barracks"
                : "",
            "friendly",
          );
        }
        en.model.scale.y = b.readyAt ? 0.45 : 1;
        en.model.userData.entity = { kind: "building", id: b.id };
        en.ring.visible =
          l.selected?.kind === "building" && l.selected.id === b.id;
        en.label.style.display =
          b.id === "capital" || en.ring.visible ? "" : "none";
        en.label.querySelector("i").style.width = `${(b.hp / b.maxHp) * 100}%`;
        positionLabel(en, b.x, b.z, b.id === "capital" ? 7 : 4);
      }
      for (const s of g.sites) {
        live.add(s.id);
        let en = rt.models.get(s.id);
        if (!en) {
          const model = fortModel(
            g.civilization,
            s.id === "citadel",
            s.owner === "enemy",
          );
          model.position.set(s.x, height(s.x, s.z), s.z);
          en = addEntity(
            s.id,
            model,
            { kind: "site", id: s.id, enemy: s.owner === "enemy" },
            s.name,
            s.owner,
          );
        }
        en.label.className = `world-label ${s.owner}`;
        en.ring.visible = l.selected?.id === s.id;
        en.model.userData.entity.enemy = s.owner === "enemy";
        en.label.querySelector("i").style.width = `${(s.hp / s.maxHp) * 100}%`;
        positionLabel(en, s.x, s.z, 7);
      }
      for (const a of g.armies) {
        live.add(a.id);
        let en = rt.models.get(a.id);
        if (en && en.formation !== a.formation) {
          entities.remove(en.model);
          en.label.remove();
          rt.models.delete(a.id);
          en = null;
        }
        if (!en) {
          const c = CHARACTERS.find((c) => c.id === a.character);
          const model = armyModel(c, a.enemy, a.formation);
          model.position.set(a.x, height(a.x, a.z), a.z);
          en = addEntity(
            a.id,
            model,
            { kind: "army", id: a.id, enemy: a.enemy },
            `${a.count}`,
            a.enemy ? "army enemy" : "army friendly",
          );
          en.formation = a.formation;
          en.lastHp = a.hp;
        }
        if (en.lastHp > a.hp) {
          const damage = document.createElement("span");
          damage.className = "damage-number";
          damage.textContent = `−${Math.round(en.lastHp - a.hp)}`;
          en.label.appendChild(damage);
          setTimeout(() => damage.remove(), 900);
        }
        en.lastHp = a.hp;
        if (a.lastAttack && en.lastAttack !== a.lastAttack) {
          en.lastAttack = a.lastAttack;
          const targetArmy = g.armies.find((t) => t.id === a.attackTarget);
          if (targetArmy) {
            const fx = new THREE.Mesh(
              new THREE.SphereGeometry(0.15, 5, 4),
              new THREE.MeshBasicMaterial({
                color: a.enemy ? "#f1a173" : "#f4d88e",
              }),
            );
            const from = new THREE.Vector3(a.x, height(a.x, a.z) + 1.5, a.z),
              to = new THREE.Vector3(
                targetArmy.x,
                height(targetArmy.x, targetArmy.z) + 1.5,
                targetArmy.z,
              );
            fx.position.copy(from);
            scene.add(fx);
            effects.push({ fx, from, to, start: performance.now() });
          }
        }
        const pos = en.model.position,
          dx = a.x - pos.x,
          dz = a.z - pos.z;
        pos.x += dx * 0.065;
        pos.z += dz * 0.065;
        pos.y =
          height(pos.x, pos.z) +
          (a.status === "Marching" && !l.settings.reducedMotion
            ? Math.sin(performance.now() * 0.012) * 0.055
            : 0);
        if (Math.abs(dx) + Math.abs(dz) > 0.05)
          en.model.rotation.y = Math.atan2(dx, dz);
        en.ring.visible =
          l.selected?.kind === "army" &&
          (l.selected.ids || [l.selected.id]).includes(a.id);
        en.label.classList.toggle("selected", en.ring.visible);
        en.label.querySelector("i").style.width =
          `${Math.max(0, (a.hp / a.maxHp) * 100)}%`;
        en.label.querySelector(".map-health").style.display = l.settings
          .showHealth
          ? ""
          : "none";
        en.label.classList.toggle("fighting", a.status === "Fighting");
        positionLabel(en, pos.x, pos.z, 3.3);
      }
      for (const [id, en] of rt.models) {
        if (!live.has(id)) {
          en.ring.visible = false;
          dying.push({ model: en.model, start: performance.now() });
          en.label.remove();
          rt.models.delete(id);
        }
      }
      if (destination.visible && performance.now() - destinationAt > 1600)
        destination.visible = false;
      ghost.visible = !!l.placing && ghost.visible;
      for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i],
          t = Math.min(1, (performance.now() - e.start) / 500);
        e.fx.position.lerpVectors(e.from, e.to, t);
        e.fx.position.y += Math.sin(t * Math.PI) * 1.3;
        if (t === 1) {
          scene.remove(e.fx);
          e.fx.geometry.dispose();
          e.fx.material.dispose();
          effects.splice(i, 1);
        }
      }
      for (let i = dying.length - 1; i >= 0; i--) {
        const d = dying[i],
          t = Math.min(1, (performance.now() - d.start) / 650);
        d.model.scale.setScalar(1 - t);
        if (t === 1) {
          entities.remove(d.model);
          dying.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
      if (frameCount === 2) onReady?.();
    };
    function positionLabel(en, x, z, y) {
      projected.set(x, height(x, z) + y, z).project(camera);
      en.label.style.transform = `translate(${(projected.x * 0.5 + 0.5) * el.clientWidth}px,${(-projected.y * 0.5 + 0.5) * el.clientHeight}px) translate(-50%,-100%)`;
      en.label.style.visibility =
        projected.x < -1.1 ||
        projected.x > 1.1 ||
        projected.y < -1.1 ||
        projected.y > 1.1
          ? "hidden"
          : "visible";
    }
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material?.dispose();
        }
      });
      renderer.dispose();
      el.replaceChildren();
      runtime.current = null;
    };
  }, [game.civilization, game.createdAt, settings.graphics]);
  return (
    <div
      className={`battlefield ${placing ? "is-placing" : ""}`}
      ref={host}
      aria-label="Interactive elevated strategy map. Drag to pan, scroll to zoom, select an army and right click to move."
    />
  );
});
