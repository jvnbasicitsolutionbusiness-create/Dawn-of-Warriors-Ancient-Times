import {
  advanceMovement,
  action,
  newGame,
  publicGame,
  step,
} from "../../shared/engine.js";
import { DEFAULT_SETTINGS } from "../../shared/catalog.js";

const GAME_KEY = "dawn-of-warriors.game";
const SETTINGS_KEY = "dawn-of-warriors.settings";
let lastStepAt = Date.now();
let lastMovementAt = lastStepAt;

function read(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Saved browser data is corrupted (${key}).`, {
      cause: error,
    });
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(
      "The browser could not save your data. Check available storage and privacy settings.",
      { cause: error },
    );
  }
}

function currentGame() {
  let state = read(GAME_KEY, null);
  if (!state) {
    state = newGame();
    write(GAME_KEY, state);
    lastStepAt = Date.now();
    lastMovementAt = lastStepAt;
  }
  const now = Date.now();
  const movementElapsed = Math.min(
    0.25,
    Math.max(0, (now - lastMovementAt) / 1000),
  );
  lastMovementAt = now;
  advanceMovement(state, movementElapsed);
  const elapsedSeconds = Math.min(30, Math.floor((now - lastStepAt) / 1000));
  for (let i = 0; i < elapsedSeconds; i++) step(state, 0);
  if (elapsedSeconds || movementElapsed) {
    lastStepAt += elapsedSeconds * 1000;
    write(GAME_KEY, state);
  }
  return state;
}

export function getGame() {
  return publicGame(currentGame());
}

export function startGame(civilization, mode) {
  const state = newGame(civilization, mode);
  write(GAME_KEY, state);
  lastStepAt = Date.now();
  lastMovementAt = lastStepAt;
  return publicGame(state);
}

export function performAction(type, data) {
  const state = currentGame();
  action(state, type, data);
  write(GAME_KEY, state);
  return publicGame(state);
}

export function saveGame() {
  const state = currentGame();
  write(GAME_KEY, state);
  return { savedAt: Date.now(), tick: state.tick };
}

export function getSettings() {
  return read(SETTINGS_KEY, { ...DEFAULT_SETTINGS });
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings);
  return settings;
}
